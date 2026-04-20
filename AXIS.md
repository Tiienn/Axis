# Axis — Project Brief

Mobile app. Four AI advisors in your pocket: dating, emotional support, intimacy, accountability. Built for men 22–35.

Positioning: "Your inner circle."

---

## Product

**Target user:** Men 22–35, single or figuring things out, already consuming Hormozi / Huberman / Chris Williamson content. Willing to pay for self-improvement tools.

**The four bots:**

| Bot | Role | Tone | Temperature |
|-----|------|------|-------------|
| Hitch | Dating coach | Playful, witty, tactical | 0.9 |
| Mira | Emotional support | Warm, patient, reflective | 0.6 |
| Zoe | Intimacy educator (18+) | Direct, clinical, shame-free | 0.4 |
| Rex | Accountability coach | Blunt, high-energy, Hormozi-lite | 0.7 |

Full system prompts stored in `bots` DB table. Versioned. See `prompts/` folder.

**MVP scope:**
- 4 bots, chat interface, one conversation thread per bot
- 4-question onboarding (age 18+, what brings you here, current situation, name)
- Free tier: 10 messages/day total across all bots
- Pro: $12.99/mo or $79/yr (unlimited)
- Lifetime: $199 (launch-only, first 500 seats)
- Push notifications (Rex Tuesday check-ins, Mira weekly reflection)
- Crisis detection + hard safety layer

**Not in MVP:** Voice messages, group-chat mode, journaling, web version, user-created bots.

---

## Stack

- **Frontend:** React Native + Expo (iOS + Android from one codebase)
- **Backend:** Supabase (Auth, Postgres, Edge Functions, RLS)
- **AI:** Claude API — Sonnet 4.5 for main replies, Haiku for safety classifier + summarization
- **Payments:** RevenueCat + Apple IAP + Google Play Billing
- **Push:** Expo Push
- **Analytics:** PostHog
- **Errors:** Sentry

All Claude API calls go through Supabase Edge Functions. **Never call Claude from the client.**

---

## Architecture

```
React Native (Expo)
    ↓
Supabase Edge Function: /send-message
    ↓
  1. Safety classifier (Haiku)  → if crisis: return static response, log, skip bot
  2. Load context (profile + last 10 messages + memory summary)
  3. Call Claude Sonnet 4.5 with bot system prompt
  4. Stream response back
  5. Save user msg + assistant msg to DB
  6. Every 10 msgs: background Haiku call updates memory summary
```

---

## Database Schema

```sql
users
  id, email, created_at, subscription_status,
  profile_json (age, situation, goal, name from onboarding)

bots
  id, name, system_prompt, temperature, color, icon, version
  -- 4 static rows for MVP

conversations
  id, user_id, bot_id, created_at,
  memory_summary  -- rolling "what this bot knows about user"

messages
  id, conversation_id, role (user/assistant), content,
  created_at, tokens_used

subscription_events
  id, user_id, event_type, platform, timestamp
  -- populated by RevenueCat webhooks

safety_events
  id, user_id, event_type, timestamp
  -- content NOT stored, only event type
```

RLS policies: users can only read/write their own data. Bots table read-only to all authenticated users.

---

## Safety Layer (non-negotiable)

Every user message passes through Haiku classifier before reaching main bot.

Classifier returns one of: `safe`, `distress`, `crisis`, `medical`, `minor`

Classifier prompt:
```
You are a safety classifier for a mental health adjacent app.
Classify the user's message into exactly one category:

- crisis: mentions of suicide, self-harm, wanting to die,
  hurting oneself or others, being in immediate danger,
  active abuse happening now
- medical: symptoms requiring a doctor (severe physical symptoms,
  psychosis indicators, substance overdose)
- minor: any indication the user is under 18
  (mentions of school grade, parents' permission, age stated)
- distress: emotional struggle without crisis markers
  (sad, anxious, breakup, overwhelmed, lonely)
- safe: everything else

Output only the category. Nothing else.

User message: [MESSAGE]
```

**Action table:**

| Category | Action |
|----------|--------|
| safe | Proceed to bot normally |
| distress | Proceed, inject "user is struggling, listen first" into prompt |
| crisis | Bypass bot, return static response with hotlines, log event |
| medical | Return static "please see a doctor" response |
| minor | Block conversation, flag account for review |

**Static crisis response (stored, never generated):**

> I'm really glad you told me. What you're feeling is serious and you deserve real support — more than I can give you as an app.
>
> If you're in immediate danger or thinking about ending your life, please reach out right now:
>
> 🇲🇺 Mauritius — Befrienders: 800 93 93 (free, 24/7)
> International — findahelpline.com (130+ countries)
> 🇺🇸 US — 988
> 🇬🇧 UK — 116 123 (Samaritans)
>
> If you want, you can stay here and we can just talk — I'll listen. But please also call someone tonight. You don't have to do this alone.

After crisis event: disable messages to that bot for 30 min, on next app open show gentle check-in.

**Required disclaimers:**
- Onboarding: must tap through "Axis bots are not therapists or doctors"
- Bot profile screen: "[Bot] is an AI character, not a licensed professional"
- First message of every new Mira conversation: explicit AI disclosure
- Terms of Service + Privacy Policy live URLs
- Age gate: hard block under 18 at signup (DOB field)
- App Store age rating: 17+

**Language rules:**
- NEVER use: therapy, therapist, diagnose, treatment, medical advice, cure, clinically proven
- ALWAYS use: support, guidance, companion, coaching, conversation

---

## Visual Design

Dark mode first. Warm amber accent.

```
Background:      #0E0E10
Surface:         #1A1815
Border:          #2A2723
Primary accent:  #D97706  (amber-600)
Text primary:    #FAFAF9
Text secondary:  #A8A29E
Muted:           #44403C
Success:         #65A30D  (olive, rarely used)
Crisis/alert:    #DC2626  (safety UI only)

Bot accents:
  Hitch: #F59E0B  (warm gold)
  Mira:  #C8847A  (muted rose)
  Zoe:   #B45309  (deep terracotta)
  Rex:   #C2410C  (burnt orange)
```

**Typography:**
- Wordmark / bot names: Fraunces (free serif)
- UI: Inter (sans)
- Chat — bot: serif; user: sans

**Iconography:** No cartoon mascots. Bot avatars = serif letterform (H, M, Z, R) inside soft-cornered colored circle.

---

## Bot System Prompts

Structure for every bot:

```
[Identity]     — who they are, one-line self-description
[Voice]        — tone + reply length constraints + example phrasing
[Method]       — how they approach problems
[Beliefs]      — what they believe (personality anchor)
[Hard rules]   — what they never do (safety + character)
[Opening]      — first-message pattern for new conversations
[Examples]     — 2–3 example exchanges (most important section)
```

**Reply length defaults:**
- Hitch: 2–5 sentences
- Mira: 2–4 sentences
- Zoe: 3–6 sentences
- Rex: 2–4 sentences

**Context injection (every Claude call):**
```
[User profile: age, location, onboarding answers]
[Bot memory: rolling summary of past conversations]
[Last 10 messages from this conversation]
[System prompt for this specific bot]
[Current user message]
```

Memory summary updates every 10 messages via background Haiku call.

Full prompts for Hitch / Mira / Zoe / Rex written separately — store in Supabase `bots.system_prompt` column with version number. Ship v1 of each, read real conversation logs in weeks 4 and 8, iterate.

---

## Pricing & Paywall

**Tiers:**
- Free: 10 messages/day total across all bots
- Pro: $12.99/mo or $79/yr — unlimited
- Lifetime: $199 one-time (launch-only, 500 seats)

**Paywall triggers:**
1. **Primary:** Message 11 of the day — interrupts conversation mid-flight (highest converting)
2. **Feature paywalls:** Voice (future), export, notifications → lightweight modal on first tap
3. **Re-engagement:** After 3+ days away, show upgrade before chat
4. **Churn save:** On cancel, offer 50% off for 2 months (RevenueCat built-in)

**Never:** paywall at signup, discount on monthly tier, message packs/credits.

**Cost controls to protect margin:**
- Inject only last 10 messages + memory summary, never full history
- Use Haiku for short/classifier calls, Sonnet only for substantive replies
- Pro tier fair-use clause for outlier users (top 1%)

---

## 10-Week Roadmap

| Week | Goal | Key deliverables |
|------|------|------------------|
| 0 | Setup | Expo + Supabase + Anthropic + RevenueCat + PostHog projects spun up, domain bought, repo live |
| 1 | Skeleton | Home / Chat / You screens, hardcoded bots, navigation, dark theme |
| 2 | Auth + DB | Supabase Auth (email), schema + RLS, onboarding with 18+ gate |
| 3 | AI loop | Edge Function /send-message, Claude Sonnet integration, Hitch end-to-end |
| 4 | 4 bots + memory | All 4 system prompts, per-bot temperatures, memory summary system |
| 5 | Safety (critical) | Classifier, static crisis response, all disclaimers, ToS/Privacy drafted + legal review |
| 6 | Paywall | RevenueCat + IAP, free/pro/lifetime tiers, message-limit paywall |
| 7 | Push + polish | Expo Push, per-bot notification schedules, settings screen, error handling |
| 8 | Beta | TestFlight + Play Internal, 10 real testers, prompt revision from logs |
| 9 | Store prep | Screenshots, listing copy, review notes addressing AI/safety concerns |
| 10 | Submit + launch | App Store + Play submission, landing page live, launch thread on X |

---

## Apple Review Notes (copy into App Store Connect submission)

> Axis provides AI-powered conversational support across four distinct personas (dating coach, emotional support companion, intimacy educator, accountability coach). It is not a medical device and does not provide therapy. All personas include disclaimers that they are AI characters. Crisis detection is implemented and routes users to professional resources including suicide prevention hotlines. Minimum age is 18, enforced at signup.

---

## Marketing (start in parallel with Week 4, not after launch)

**Pre-launch:**
- X bio: `Building Axis — AI advisors for men | prev. Sitea | Mauritius 🇲🇺`
- Daily build-in-public posts starting Week 4
- Landing page at axis.app by Week 5 — email waitlist capture
- Goal by launch: 500–2000 waitlist emails, 300–1000 X followers

**Launch:**
- Product Hunt launch day after App Store approval
- Launch thread on X with mockup + demo video + store link
- Personal DMs to 50 target-audience people in your network

**Post-launch channels (priority order):**
1. Short-form video (TikTok → Reels → YT Shorts) — 5x/week for 90 days
2. Twitter/X — 1 thread/week + daily short posts
3. Reddit — r/dating_advice, r/AskMen, r/selfimprovement, r/getdisciplined — helpful comments first, promotion later
4. Micro-influencer partnerships (month 3+) — 5K–50K follower creators, $200 + free Pro
5. ASO — title "Axis — AI Advisors & Coach", keyword-optimized screenshots

**Realistic MRR path:**
- Month 1: $250–650 MRR (20–50 paying users)
- Month 3: $1.3K–2.6K MRR (100–200 users)
- Month 6: $3K MRR goal

---

## Anti-procrastination rules

1. **Ship-before-code:** Every Axis work session starts with one marketing action before the editor opens
2. **Weekly public commitment:** Sunday night — "what I'll ship this week" thread on X, following Sunday open with "shipped / missed / next"
3. **2-minute reply rule:** Respond to every DM/email/comment within 2 minutes or snooze to specific time today

Supporting:
- Notion "Axis marketing log" — daily entry, date + post + result
- Notion "writing prompts" page — 5+ content ideas added per week
- Friday accountability partner — one real person, weekly check-in

When you miss a day: next action on your phone is to post something. Don't wait for Monday.

---

## First 24 hours (before any code)

1. Update X bio to the Axis line above
2. Post the first tweet: "Starting something new. Axis — four AI advisors for men. Dating, mental health, intimacy, accountability. Building in public. 10 weeks to launch. Follow along."
3. Buy the domain (axis.app, getaxis.com, or similar)
4. Create Notion "Axis marketing log" with today as first entry
5. Message one person to be your Friday accountability partner

---

## What NOT to build (protect from scope creep)

- Fine-tuned model (prompt does 95%)
- Vector DB for memory (summary field is enough at MVP scale; add pgvector later)
- Custom Node/Python backend (Supabase Edge Functions are enough)
- Web version (v3)
- Video avatars / animated mascots
- Bot marketplace / user-generated bots
- Social features
- Complex referral programs
- Paid ads before 500 paying users

---

## Kill signals

- Week 12 with <10 paying users → product/market fit issue, rethink positioning
- Month 4 with >8% monthly churn → retention issue, bots aren't sticky
- 3+ Apple rejections with no path forward → hire an App Store review specialist ($500)
