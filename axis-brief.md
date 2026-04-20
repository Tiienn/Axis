# Axis — Project Brief

**One-line pitch:** A pocket of AI advisors for men. Four distinct specialists — dating, mental health, intimacy, accountability — each with their own voice, method, and personality.

**Target audience:** Men 22–35, single or recently single, trying to level up their lives. Hormozi/Huberman-adjacent audience.

**Platform:** Mobile-first (iOS + Android) via React Native + Expo.

**Positioning:** "Your inner circle" — the advisors you wish you had at 2am.

---

## The four bots

| Bot | Role | Tone | Accent color |
|-----|------|------|--------------|
| **Hitch** | Dating coach | Playful, witty, tactical | `#F59E0B` (warm gold) |
| **Mira** | Emotional support companion | Warm, patient, reflective | `#C8847A` (muted rose) |
| **Zoe** | Intimacy educator | Direct, shame-free, clinical-friendly | `#B45309` (deep terracotta) |
| **Rex** | Accountability coach | Blunt, high-energy, no-BS | `#C2410C` (burnt orange) |

Full system prompts for each bot are stored in the separate `bot-prompts.md` file (keep them version-controlled in the DB, not hardcoded).

---

## Tech stack

- **Frontend:** React Native + Expo (TypeScript)
- **Backend:** Supabase (Auth, Postgres, Edge Functions, RLS)
- **AI:** Anthropic Claude API
  - Claude Sonnet 4.5 for main bot replies
  - Claude Haiku for safety classifier + memory summaries
- **Payments:** RevenueCat + Apple IAP / Google Play Billing
- **Push:** Expo Push
- **Analytics:** PostHog (events) + Sentry (crashes)

---

## Architecture

```
React Native app (Expo)
  ↓
Supabase
  ├── Auth (email, Apple, Google)
  ├── Postgres (users, bots, conversations, messages, subscription_events)
  └── Edge Functions
        /send-message → safety classifier → Claude API → stream back
  ↓
Claude API (Anthropic)
  - Sonnet 4.5 (main replies)
  - Haiku (safety classification, memory summaries)

Side systems: RevenueCat (subs), Expo Push, PostHog, Sentry
```

**Critical:** Never call Claude API from the client. API key stays in Edge Functions.

---

## Database schema (minimum viable)

```sql
users (
  id uuid primary key,
  email text unique,
  created_at timestamptz,
  subscription_status text,
  profile_json jsonb  -- age, situation, onboarding answers
)

bots (
  id uuid primary key,
  name text,
  system_prompt text,
  prompt_version int,
  temperature float,
  accent_color text,
  icon text
)

conversations (
  id uuid primary key,
  user_id uuid references users,
  bot_id uuid references bots,
  memory_summary text,  -- rolling summary updated every 10 messages
  created_at timestamptz
)

messages (
  id uuid primary key,
  conversation_id uuid references conversations,
  role text,  -- 'user' or 'assistant'
  content text,
  tokens_used int,
  created_at timestamptz
)

subscription_events (
  id uuid primary key,
  user_id uuid references users,
  event_type text,
  platform text,
  created_at timestamptz
)
```

Enable Row-Level Security on everything. Users can only read their own data.

---

## The message flow (inside Edge Function `/send-message`)

1. **Safety classifier** (Haiku, ~200ms) — classify into `safe` / `distress` / `crisis` / `medical` / `minor`
2. **If `crisis` or `medical`:** return pre-written static response with hotlines. Do NOT call main model. Log event.
3. **If `minor`:** block and flag account
4. **If `distress`:** soften bot's system prompt (append "user is struggling, prioritize listening")
5. **Load context:** user profile + last 10 messages + memory summary
6. **Call Claude Sonnet** — stream response
7. **Save both messages** to DB
8. **Every 10 messages:** trigger background Haiku call to update `memory_summary`

---

## Safety classifier prompt (Haiku)

```
You are a safety classifier for a mental health adjacent app.
Classify the user's message into exactly one category:

- crisis: mentions of suicide, self-harm, wanting to die, hurting oneself
  or others, being in immediate danger, active abuse happening now
- medical: symptoms requiring a doctor (severe physical symptoms,
  psychosis indicators, substance overdose)
- minor: any indication the user is under 18 (school grade, parents'
  permission, age stated)
- distress: emotional struggle without crisis markers (sad, anxious,
  breakup, overwhelmed, lonely)
- safe: everything else

Output only the category. Nothing else.

User message: {MESSAGE}
```

## Static crisis response (NEVER generated, always verbatim)

```
I'm really glad you told me. What you're feeling is serious and you
deserve real support — more than I can give you as an app.

If you're in immediate danger or thinking about ending your life,
please reach out right now:

🇲🇺 Mauritius — Befrienders: 800 93 93 (free, 24/7)
International — findahelpline.com (130+ countries)
🇺🇸 US — 988 (Suicide & Crisis Lifeline)
🇬🇧 UK — 116 123 (Samaritans)

If you want, you can stay here and we can just talk — I'll listen.
But please also call someone tonight. You don't have to do this alone.
```

After crisis response: log event (not content), disable new messages to that bot for 30 min, surface gentle check-in on next app open.

---

## Bot safety rules (baked into every system prompt)

**All bots must:**
- Never claim to be human. If asked, answer honestly.
- Never diagnose (no "you have depression/ADHD/anxiety")
- Never prescribe medication or specific therapies
- Never agree to sexual roleplay (especially Zoe — she's educational)
- Redirect medical → doctor, legal → lawyer, financial → professional
- Handoff to Mira if user seems in real distress (not just dating frustration)

**Per-bot specifics:**
- **Mira:** Never validate paranoid/delusional thinking. Never interpret dreams as omens. Always opens new conversation with AI disclaimer.
- **Zoe:** 18+ only. No explicit content/erotica even if framed educationally. No roleplay. Refer medical issues (ED, pain) to doctor.
- **Hitch:** Never help craft manipulation. Counter misogynist framing with a sharper alternative, not a lecture.
- **Rex:** Behavior-focused criticism, not character. Never push extreme diet/exercise. Watch for disordered eating signals.

---

## Age gating

- Minimum age: **18+** (because of Zoe)
- App Store rating: **17+**
- Hard block at signup: date of birth required, under 18 = account creation fails
- Classifier flags potential minors mid-conversation

---

## Pricing

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | All 4 bots, 10 messages/day (shared across bots), chat history |
| **Axis Pro Monthly** | $12.99/mo | Unlimited messages, push notifications, priority speed |
| **Axis Pro Annual** | $79/yr | Same as monthly, ~49% off |
| **Lifetime** | $199 one-time | Launch-only, first 500 users |

**Paywall strategy:**
1. No paywall at signup — let users meet bots first
2. **Primary paywall:** message 11 of the day, slides up interrupting the conversation
3. Feature paywalls for voice / export (secondary)
4. Re-engagement paywall after 3+ days away
5. Churn-prevention: 50% off 2 months on cancel (RevenueCat built-in)

**Cost controls (critical):**
- Cap context window: last 10 messages + memory summary only
- Use Haiku for classification + summaries (cheap)
- Sonnet only for substantive replies
- Fair-use throttling on outlier heavy users

---

## Visual identity

**Palette (dark + warm):**
- Background: `#0E0E10`
- Surface: `#1A1815`
- Primary accent: `#D97706` (amber) or `#C2410C` (terracotta)
- Text primary: `#FAFAF9`
- Text secondary: `#A8A29E`
- Muted: `#44403C`
- Crisis/alert: `#DC2626`

**Typography:**
- Wordmark + bot names: serif (Fraunces, free)
- UI: Inter or Geist
- Chat bubbles: serif for bots, sans for user

**Avatars:** Serif letterforms (H / M / Z / R) in each bot's accent color on dark circle. No cartoon mascots.

**Mode:** Dark mode only for v1. This app is used in bed, late at night, in emotional moments. Light mode feels clinical.

---

## Per-bot runtime config

| Bot | Temperature | Notes |
|-----|-------------|-------|
| Hitch | 0.9 | Wit needs variability |
| Mira | 0.6 | Warmth needs consistency |
| Zoe | 0.4 | Accuracy matters most |
| Rex | 0.7 | Energy + consistency |

---

## 10-week roadmap

**Pre-week 0 (setup):** Domains, Expo project, Supabase project, Anthropic billing, GitHub, RevenueCat, PostHog

**Week 1:** UI skeleton — home, chat, you. Hardcoded bots. No AI yet.

**Week 2:** Supabase auth, DB schema, RLS, onboarding (18+ gate)

**Week 3:** AI loop — Edge Function, Claude integration, streaming, Hitch only

**Week 4:** All 4 bots, per-bot temperatures, memory summary system

**Week 5:** SAFETY SPRINT — classifier, crisis response, disclaimers, ToS/Privacy, legal review

**Week 6:** RevenueCat, paywalls, free tier limits

**Week 7:** Push notifications (Expo), polish, settings

**Week 8:** Internal testing — 10 real users, iterate prompts

**Week 9:** Store listings, screenshots, landing page at axis.app

**Week 10:** Submit to stores, soft launch

---

## What NOT to build (v1)

- Video avatars (uncanny, expensive)
- User-created bots / marketplace (moderation nightmare)
- Social features (users want this private)
- Web version (mobile-first, web is v3)
- Fine-tuned model (system prompts do the work)
- Vector database for memory (summary field is enough for linear conversations)
- Custom auth (use Supabase)

---

## Required legal

- **Terms of Service + Privacy Policy** — use Termly or Iubenda (~$10/mo), then have a Mauritius lawyer review (Rs 10–20K)
- **Disclaimers** in onboarding, in each bot's profile, in Mira's first message, in App Store review notes
- **Never say:** "therapy," "therapist," "diagnose," "treatment," "cure," "clinically proven"
- **Do say:** "AI companion," "coach," "guide," "conversation partner"

---

## Apple review talking points

In App Store Connect review notes, proactively state:

> This app provides AI-powered conversational support across four distinct personas (dating coach, emotional support companion, intimacy educator, accountability coach). It is not a medical device and does not provide therapy. All personas include disclaimers that they are AI characters. Crisis detection is implemented and routes users to professional resources including suicide prevention hotlines. Minimum age is 18.

---

## Unit economics (watch these)

Per paying user / month at $12.99:

| Line | Amount |
|------|--------|
| Revenue | $12.99 |
| Apple cut (30% yr 1) | -$3.90 |
| AI costs (range) | -$2 to -$8 |
| RevenueCat (1% after $2.5K MRR) | -$0.09 |
| Infra (Supabase, PostHog, Sentry) | -$0.20 |
| **Net** | **$0.80 to $6.80** |

Heavy users are marginal. Cap context, use Haiku for classification, throttle outliers.

---

## Success checkpoints

- **Week 5:** Hand app to a friend, they chat with Hitch 20 min, nothing breaks
- **Week 10:** Submitted, landing page live, 10 active beta testers
- **Month 4:** 20–50 paying users, first ~$500 MRR
- **Month 6:** 100–200 paying users, $1–2K MRR
- **Month 9:** $3K MRR target

---

## Marketing fundamentals (start by week 4 of build, not after launch)

1. **Build in public on X** — 1–3 posts/day. Bio: "Building Axis — AI advisors for men | prev. Sitea | Mauritius 🇲🇺"
2. **Landing page live by week 5** at axis.app with email waitlist
3. **Reply to every waitlist email** personally — those become your first 50 customers
4. **Short-form video** (TikTok/Reels/Shorts) is the primary acquisition channel for this audience, post-launch
5. **Direct outreach** to 50 personal contacts on launch day — this is where first $ comes from
6. **Reddit** (r/dating_advice, r/AskMen, r/selfimprovement) — slow, high-intent, high-converting

**Anti-procrastination rules:**
- Ship-before-code: one marketing action BEFORE opening the code editor each session
- Weekly public commitment thread on Sunday — "shipping," "missed," "next week"
- 2-minute rule for replies — respond now or scheduled, nothing in between

---

## First actions (today)

1. Confirm domain (axis.app / getaxis.com / etc.) and buy
2. Register name on App Store Connect + Google Play Console
3. Spin up: Expo project, Supabase project, Anthropic API account, GitHub repo, RevenueCat, PostHog
4. Update X bio and post announcement tweet
5. Create Notion "Axis marketing log"

---

## File structure suggestion (for Claude Code)

```
axis/
├── app/                    # Expo Router screens
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── index.tsx       # Home (bot list)
│   │   ├── journal.tsx
│   │   └── you.tsx
│   ├── chat/[botId].tsx    # Chat screen per bot
│   └── paywall.tsx
├── components/
│   ├── chat/
│   ├── bots/
│   └── ui/
├── lib/
│   ├── supabase.ts
│   ├── revenuecat.ts
│   └── analytics.ts
├── supabase/
│   ├── migrations/
│   └── functions/
│       ├── send-message/   # The main AI endpoint
│       ├── safety-check/
│       └── summarize/
├── assets/
└── constants/
    ├── bots.ts             # Bot metadata (not prompts — those live in DB)
    └── theme.ts            # Palette + typography
```

---

## Environment variables needed

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=
EXPO_PUBLIC_POSTHOG_KEY=

# Supabase Edge Function secrets (server-side only):
ANTHROPIC_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Notes for Claude Code

- Prioritize shipping over perfection. MVP goal = first paying user, not perfect app.
- Every feature decision: does it get us closer to week 10 submission? If no, defer.
- Safety layer (week 5) is NOT optional — it gates App Store approval and protects users.
- Prompt iteration is craft work, not code work. Build infrastructure for prompt versioning in the DB, then iterate in prod.
- Keep dependencies minimal. Every library added is future maintenance.

---

**Status:** Brief. All decisions locked. Begin week 1.
