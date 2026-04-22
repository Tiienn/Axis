// Axis /send-message edge function.
// Validates the caller, assembles context (bot prompt + profile + last 10 messages),
// calls Claude, persists both messages, returns the assistant reply.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.104.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const MODEL = 'claude-sonnet-4-6';
const SUMMARY_MODEL = 'claude-haiku-4-5-20251001';
const CLASSIFIER_MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 512;
const SUMMARY_MAX_TOKENS = 300;
const CLASSIFIER_MAX_TOKENS = 20;
const HISTORY_LIMIT = 10;
const SUMMARY_EVERY = 20; // 10 user + 10 assistant = 20 rows
const FREE_DAILY_LIMIT = 10;
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const SUMMARY_SYSTEM =
  "Summarize what matters about this user -- what they're dealing with, what's been said, any personal details. Keep it under 200 words. No preamble.";

const CLASSIFIER_SYSTEM =
  'You are a safety classifier for a mental wellness app. Classify the user\'s message:\n' +
  '- "crisis": explicit self-harm, suicide ideation, plans to hurt self or others, or imminent danger\n' +
  '- "distress": strong emotional pain, grief, panic, without self-harm indicators\n' +
  '- "none": everything else\n\n' +
  'Respond with ONLY a single JSON object: {"level": "crisis" | "distress" | "none"}. No preamble, no markdown.';

const CRISIS_RESPONSE = `I hear you, and I'm really glad you reached out. What you're feeling is serious, and there are people trained for exactly this who can help right now:

- Call or text 988 -- Suicide & Crisis Lifeline (free, 24/7)
- Text HOME to 741741 -- Crisis Text Line
- If you're in immediate danger, call 911

You don't have to carry this alone. Please reach out to one of these now.`;

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

  const [botRes, profileRes, level] = await Promise.all([
    admin.from('bots').select('id, name, system_prompt, temperature').eq('id', botId).single(),
    admin.from('users').select('profile_json, subscription_status').eq('id', userId).single(),
    classifyMessage(userMessage),
  ]);
  if (botRes.error || !botRes.data) return json(404, { error: 'bot not found' });
  if (profileRes.error || !profileRes.data) return json(404, { error: 'user profile missing' });
  const bot = botRes.data;
  const profile = (profileRes.data.profile_json ?? {}) as {
    name?: string;
    goal?: string;
    situation?: string;
  };
  const subscriptionStatus = profileRes.data.subscription_status ?? 'free';

  const convRes = await admin
    .from('conversations')
    .upsert({ user_id: userId, bot_id: bot.id }, { onConflict: 'user_id,bot_id' })
    .select('id, memory_summary')
    .single();
  if (convRes.error || !convRes.data) return json(500, { error: 'conversation upsert failed' });
  const conversationId = convRes.data.id;
  const memorySummary = convRes.data.memory_summary ?? '';

  if (level === 'crisis') {
    const crisisInsert = await admin
      .from('messages')
      .insert([
        { conversation_id: conversationId, role: 'user', content: userMessage, tokens_used: 0 },
        { conversation_id: conversationId, role: 'assistant', content: CRISIS_RESPONSE, tokens_used: 0 },
      ])
      .select('id, role, created_at');
    if (crisisInsert.error) return json(500, { error: 'crisis message save failed' });

    await admin.from('safety_events').insert({
      user_id: userId,
      conversation_id: conversationId,
      event_type: 'crisis',
      message_content: userMessage,
    });

    const assistantRow = crisisInsert.data.find((m) => m.role === 'assistant');
    return json(200, {
      reply: CRISIS_RESPONSE,
      messageId: assistantRow?.id,
      createdAt: assistantRow?.created_at,
    });
  }

  if (level === 'distress') {
    await admin.from('safety_events').insert({
      user_id: userId,
      conversation_id: conversationId,
      event_type: 'distress',
      message_content: userMessage,
    });
  }

  if (subscriptionStatus === 'free') {
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const rateRes = await admin
      .from('messages')
      .select('id, conversations!inner(user_id)', { count: 'exact', head: true })
      .eq('conversations.user_id', userId)
      .eq('role', 'user')
      .gte('created_at', since);
    const usedCount = rateRes.count ?? 0;
    if (usedCount >= FREE_DAILY_LIMIT) {
      return json(429, {
        error: 'rate_limited',
        limit: FREE_DAILY_LIMIT,
        window_hours: 24,
        used: usedCount,
      });
    }
  }

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
  const parts = [bot.system_prompt];
  if (profileLine) parts.push(`# About the user\n${profileLine}`);
  if (memorySummary) parts.push(`# What you remember about past conversations\n${memorySummary}`);
  const systemPrompt = parts.join('\n\n');

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

  const countRes = await admin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId);
  const totalMessages = countRes.count ?? 0;
  if (totalMessages > 0 && totalMessages % SUMMARY_EVERY === 0) {
    try {
      await updateMemorySummary(admin, conversationId);
    } catch (e) {
      console.error('summary update failed', e);
    }
  }

  return json(200, {
    reply,
    messageId: assistantRow?.id,
    createdAt: assistantRow?.created_at,
  });
});

async function updateMemorySummary(
  admin: ReturnType<typeof createClient>,
  conversationId: string,
) {
  const { data, error } = await admin
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error || !data) return;

  const transcript = data
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: SUMMARY_MODEL,
      max_tokens: SUMMARY_MAX_TOKENS,
      system: SUMMARY_SYSTEM,
      messages: [{ role: 'user', content: transcript }],
    }),
  });
  if (!res.ok) {
    console.error('summary anthropic error', res.status, await res.text());
    return;
  }
  const body = await res.json();
  const summary: string = (body.content ?? [])
    .filter((c: { type: string }) => c.type === 'text')
    .map((c: { text: string }) => c.text)
    .join('')
    .trim();
  if (!summary) return;

  await admin
    .from('conversations')
    .update({ memory_summary: summary })
    .eq('id', conversationId);
}

async function classifyMessage(userMessage: string): Promise<'crisis' | 'distress' | 'none'> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLASSIFIER_MODEL,
        max_tokens: CLASSIFIER_MAX_TOKENS,
        system: CLASSIFIER_SYSTEM,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    if (!res.ok) {
      console.error('classifier http error', res.status, await res.text());
      return 'none';
    }
    const body = await res.json();
    const text: string = (body.content ?? [])
      .filter((c: { type: string }) => c.type === 'text')
      .map((c: { text: string }) => c.text)
      .join('');
    const match = text.match(/"level"\s*:\s*"(crisis|distress|none)"/);
    return match ? (match[1] as 'crisis' | 'distress' | 'none') : 'none';
  } catch (e) {
    console.error('classifier error', e);
    return 'none';
  }
}
