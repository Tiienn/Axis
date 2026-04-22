// Axis /send-message edge function.
// Validates the caller, assembles context (bot prompt + profile + last 10 messages),
// calls Claude, persists both messages, returns the assistant reply.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.104.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 512;
const HISTORY_LIMIT = 10;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Body = { botId?: string; userMessage?: string };
type Msg = { role: 'user' | 'assistant'; content: string };

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return json(401, { error: 'missing bearer token' });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return json(401, { error: 'invalid token' });
  const userId = userData.user.id;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid json' });
  }
  const botId = body.botId?.trim();
  const userMessage = body.userMessage?.trim();
  if (!botId || !userMessage) return json(400, { error: 'botId and userMessage required' });

  const [botRes, profileRes] = await Promise.all([
    admin.from('bots').select('id, name, system_prompt, temperature').eq('id', botId).single(),
    admin.from('users').select('profile_json').eq('id', userId).single(),
  ]);
  if (botRes.error || !botRes.data) return json(404, { error: 'bot not found' });
  if (profileRes.error || !profileRes.data) return json(404, { error: 'user profile missing' });
  const bot = botRes.data;
  const profile = (profileRes.data.profile_json ?? {}) as {
    name?: string;
    goal?: string;
    situation?: string;
  };

  const convRes = await admin
    .from('conversations')
    .upsert({ user_id: userId, bot_id: bot.id }, { onConflict: 'user_id,bot_id' })
    .select('id')
    .single();
  if (convRes.error || !convRes.data) return json(500, { error: 'conversation upsert failed' });
  const conversationId = convRes.data.id;

  const historyRes = await admin
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);
  if (historyRes.error) return json(500, { error: 'history load failed' });
  const history: Msg[] = (historyRes.data ?? [])
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const profileLine = [
    profile.name ? `Name: ${profile.name}` : null,
    profile.goal ? `What brings them here: ${profile.goal}` : null,
    profile.situation ? `Current situation: ${profile.situation}` : null,
  ]
    .filter(Boolean)
    .join('\n');
  const systemPrompt = profileLine
    ? `${bot.system_prompt}\n\n# About the user\n${profileLine}`
    : bot.system_prompt;

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: bot.temperature,
      system: systemPrompt,
      messages: [...history, { role: 'user', content: userMessage }],
    }),
  });

  if (!anthropicRes.ok) {
    const text = await anthropicRes.text();
    console.error('anthropic error', anthropicRes.status, text);
    return json(502, { error: 'upstream failed', status: anthropicRes.status });
  }

  const anthropicBody = await anthropicRes.json();
  const reply: string = (anthropicBody.content ?? [])
    .filter((c: { type: string }) => c.type === 'text')
    .map((c: { text: string }) => c.text)
    .join('')
    .trim();
  const tokensUsed: number = anthropicBody.usage?.output_tokens ?? 0;

  if (!reply) return json(502, { error: 'empty reply' });

  const insertRes = await admin
    .from('messages')
    .insert([
      { conversation_id: conversationId, role: 'user', content: userMessage, tokens_used: 0 },
      {
        conversation_id: conversationId,
        role: 'assistant',
        content: reply,
        tokens_used: tokensUsed,
      },
    ])
    .select('id, role, content, created_at');
  if (insertRes.error) return json(500, { error: 'message save failed' });

  const assistantRow = insertRes.data.find((m) => m.role === 'assistant');
  return json(200, {
    reply,
    messageId: assistantRow?.id,
    createdAt: assistantRow?.created_at,
  });
});
