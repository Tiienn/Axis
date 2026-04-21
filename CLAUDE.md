# Claude Rules

1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them.
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made.
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.
8. DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY.
9. MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY.

---

# Week 0 Plan — Setup

Goal: get the repo, Expo project, and all external service accounts ready so Week 1 (UI skeleton) can start with nothing blocking.

## You do (external accounts — I can't sign up for you)

- [ ] Buy domain (axis.app / getaxis.com / similar) via Namecheap or Cloudflare
- [ ] Create Apple Developer account ($99/yr) and App Store Connect app record named "Axis"
- [ ] Create Google Play Console account ($25 one-time) and app record
- [ ] Create Anthropic API account, add billing, generate API key
- [ ] Create Supabase project (free tier), note URL + anon key + service role key
- [ ] Create RevenueCat account, add iOS + Android apps, note public SDK keys
- [ ] Create PostHog project (free tier), note project API key
- [ ] Create Sentry project (React Native), note DSN
- [ ] Create Expo account (`expo.dev`) for EAS builds later
- [ ] Create GitHub repo `axis` (private), push initial commit once I scaffold
- [ ] Update X bio + post the announcement tweet from [AXIS.md:322](AXIS.md:322)
- [ ] Create Notion "Axis marketing log" page, today's first entry

## I do (code scaffolding)

- [ ] Initialize Expo project with TypeScript + Expo Router in this directory
- [ ] Create folder structure per [axis-brief.md:362](axis-brief.md:362) (`app/`, `components/`, `lib/`, `supabase/`, `constants/`, `assets/`)
- [ ] Add `constants/theme.ts` — palette + typography from [AXIS.md:167](AXIS.md:167)
- [ ] Add `constants/bots.ts` — bot metadata (name, color, role) only, no prompts
- [ ] Add `.env.example` with the vars from [axis-brief.md:398](axis-brief.md:398)
- [ ] Add `.gitignore` (node_modules, .env, .expo, ios/, android/, build artifacts)
- [ ] Install Fraunces + Inter fonts via `expo-font`
- [ ] Install core deps only: `@supabase/supabase-js`, `expo-router`, `expo-font`
- [ ] Verify `npx expo start` boots cleanly with a "Hello Axis" default screen
- [ ] `git init` + first commit

## Out of scope for Week 0

- Any screen beyond the Expo default boot screen (that's Week 1)
- Supabase schema / migrations (Week 2)
- Any Claude API / Edge Function code (Week 3)
- RevenueCat SDK install (Week 6) — account creation is enough for now

## Review

**Status:** Code scaffolding complete. External account tasks still pending on user.

**What landed:**
- Expo SDK 54 default template scaffolded in-place (Expo Router, TypeScript, React 19, RN 0.81)
- Package renamed `axis-scaffold` → `axis`
- [constants/theme.ts](constants/theme.ts) — rewritten with Axis palette (`AxisColors`), per-bot accents (`BotAccents`), and Fraunces/Inter font names. Kept `Colors` + `Fonts` exports that template components depend on; both `light` and `dark` point to dark values since the app is dark-only
- [constants/bots.ts](constants/bots.ts) — metadata only (id, name, role, letter, color, temperature). Prompts intentionally NOT hardcoded — they live in the `bots` DB table per brief
- [.env.example](.env.example) — all client + server vars from brief, including `EXPO_PUBLIC_SENTRY_DSN`
- [.gitignore](.gitignore) — added `.env` + `!.env.example` so real secrets can't be committed
- `@supabase/supabase-js@^2.104.0` installed via `npx expo install`
- TypeScript compiles clean (`tsc --noEmit`)
- Metro boots cleanly on localhost:8081 (verified via `npx expo start`)
- First commit: `0477346` on branch `main`

**Boilerplate left in place (to be replaced in Week 1):**
- Template screens: `app/(tabs)/index.tsx`, `app/(tabs)/explore.tsx`, `app/modal.tsx`
- Template components: `hello-wave`, `parallax-scroll-view`, `themed-text`, `themed-view`, `haptic-tab`, `external-link`, `ui/`
- These are kept so boot verification passes; Week 1 will strip and replace with Home / Chat / You screens

**Deferred (scope-creep per rule #6):**
- Fraunces + Inter font TTFs not downloaded/wired yet — font names are configured in `theme.ts` but actual loading via `expo-font` waits until Week 1 when UI needs them
- RevenueCat, PostHog, Sentry SDKs — not installed per Week 0 plan (those arrive in Weeks 6–7)

**Known non-issue:**
- `xcrun simctl` error on `expo start` — that's Xcode CLI tools not fully set up for iOS sim launching, unrelated to Metro. Won't affect dev on a configured Mac.

**Next — blocking for Week 1:**
1. User finishes "You do" checklist above (accounts, domain, GitHub remote)
2. Once GitHub remote exists, push `main` to it
3. Then start Week 1: strip template, build Home / Chat / You skeleton

---

# Week 1 Plan — UI Skeleton

Goal: user opens app → sees Home with 4 bot cards → taps a bot → lands on Chat screen for that bot → can navigate back. Plus a You tab placeholder. Dark theme, Fraunces/Inter fonts wired. **No AI, no auth, no DB yet** — pure navigation skeleton with hardcoded bot data.

## Tasks

**Fonts:**
- [ ] Install `@expo-google-fonts/fraunces` + `@expo-google-fonts/inter`
- [ ] Load fonts in `app/_layout.tsx` with splash-screen gate so UI doesn't flash unstyled text

**Strip template boilerplate (per Week 0 review, these have to go now):**
- [ ] Delete `app/(tabs)/explore.tsx` (template's second tab)
- [ ] Delete `app/modal.tsx` (template's modal example)
- [ ] Delete unused components: `hello-wave.tsx`, `parallax-scroll-view.tsx`, `external-link.tsx`, `haptic-tab.tsx`, `components/ui/` (collapsible + icon-symbol)
- [ ] Delete `scripts/reset-project.js` + its `npm run reset-project` script in package.json (it's a template helper that resets to blank — we don't need it)
- [ ] Delete template assets: `partial-react-logo.png`, `react-logo*.png` (Axis icons come later)
- [ ] Simplify `app/_layout.tsx` — dark-only, no `useColorScheme` toggle

**Screens:**
- [ ] Rewrite `app/(tabs)/_layout.tsx` — 2 tabs: Home, You (icons from `@expo/vector-icons`, Axis dark theme)
- [ ] Rewrite `app/(tabs)/index.tsx` — Home: header "Your inner circle", scroll list of 4 bot cards (avatar + name + role), tapping routes to `/chat/[botId]`
- [ ] Create `app/(tabs)/you.tsx` — placeholder card: "Free tier — 10 messages/day" + Settings link stub
- [ ] Create `app/chat/[botId].tsx` — Chat screen stub: header with bot name, empty message list, text input at bottom (disabled placeholder, no send yet)

**Components (new, minimal):**
- [ ] `components/bot-avatar.tsx` — serif letter on colored circle, size prop
- [ ] `components/bot-card.tsx` — Home row component (avatar + name + role)

**Theme wiring:**
- [ ] Update `components/themed-text.tsx` + `themed-view.tsx` to use `AxisColors` + `Fonts` (or delete if not needed)

**Verify:**
- [ ] `tsc --noEmit` passes
- [ ] `npx expo start` boots clean
- [ ] Manually confirm: Home → tap bot → Chat opens with right bot → back → You tab works

**Commit + push.**

## Out of scope for Week 1

- Auth / onboarding (Week 2)
- Any Supabase wiring (Week 2)
- Sending messages / Claude integration (Week 3)
- Persistence (Week 2)
- Real splash/app icons (Week 9)

## Review

**Status:** UI skeleton done. Nav + theme + fonts all live. No AI/auth/DB wiring (on purpose).

**Stripped:**
- Template screens (`explore`, `modal`) and demo components (`hello-wave`, `parallax-scroll-view`, `external-link`, `haptic-tab`, `themed-text`, `themed-view`, `ui/`)
- `hooks/` dir (was color-scheme toggle + theme-color — not needed, dark-only)
- `scripts/reset-project.js` + `npm run reset-project` script in [package.json](package.json)
- `assets/images/react-logo*.png` + `partial-react-logo.png`

**Shipped:**
- [constants/theme.ts](constants/theme.ts) — simplified to `AxisColors`, `BotAccents`, `FontFamily`. Dropped the template's `Colors`/`Fonts` exports since nothing imports them anymore
- [components/bot-avatar.tsx](components/bot-avatar.tsx) — serif letter on colored circle, size prop
- [components/bot-card.tsx](components/bot-card.tsx) — Home row (avatar + name + role + chevron)
- [app/_layout.tsx](app/_layout.tsx) — root: loads Fraunces + Inter via `@expo-google-fonts/*`, splash-screen gate, custom `axisTheme` on React Navigation's DarkTheme, registers `(tabs)` and `chat/[botId]` stacks
- [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx) — 2 tabs (Home, You) with Ionicons, Axis colors
- [app/(tabs)/index.tsx](app/(tabs)/index.tsx) — Home: "Axis" wordmark + "Your inner circle" tagline + 4 bot cards
- [app/(tabs)/you.tsx](app/(tabs)/you.tsx) — You tab: free-tier usage card + stub list
- [app/chat/[botId].tsx](app/chat/[botId].tsx) — Chat screen: header with BotAvatar + back button, empty state, disabled text input (enabled Week 3)

**Deps added:** `@expo-google-fonts/fraunces@^0.4.1`, `@expo-google-fonts/inter@^0.4.2` (Regular + SemiBold weights only per simplicity rule)

**Verified:**
- `npx tsc --noEmit` → exit 0
- `npx expo start` → Metro reaches "Waiting on http://localhost:8081" clean
- Router types regenerated with `/chat/[botId]` route registered
- Font package files `400Regular` + `600SemiBold` exist in both packages

**Not yet tested (requires simulator/device):**
- Visual rendering of screens
- Navigation transitions (Home → Chat → back)
- Font actually displaying in UI vs. fallback

**Next — Week 2:** Supabase auth (email), DB schema + RLS, onboarding flow with 18+ age gate.

---

# Week 2 Plan — Auth + DB

Goal: new user can open app → sign up with email + password + DOB (18+ hard-gated) → complete 4-question onboarding (name, what brings you here, current situation) → land on Home with a real session. Returning users sign in → Home. All data persisted to Supabase with RLS.

**Prereq (external):** Supabase project created in Week 0 "You do" list. Need `.env` populated with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to test live. Code can ship without them; it'll just fail on first auth call.

## Tasks

**Deps:**
- [ ] Install `@react-native-async-storage/async-storage` (session persistence) + `react-native-url-polyfill` (fetch polyfill Supabase needs on RN)

**Supabase client:**
- [ ] `lib/supabase.ts` — client with AsyncStorage adapter, auto-refresh token, persist session

**Schema — SQL migration (user pastes into Supabase SQL editor):**
- [ ] `supabase/migrations/0001_init.sql` — all 6 tables per [AXIS.md:68](AXIS.md:68) (users, bots, conversations, messages, subscription_events, safety_events)
- [ ] RLS on every table. Users see only their own rows; `bots` is public-read for authenticated users
- [ ] Trigger: when a new auth.users row is created, insert matching row into public.users
- [ ] Seed `bots` table with 4 rows — name, system_prompt (pasted from [bot-prompts.md](bot-prompts.md)), temperature, accent_color, prompt_version=1

**Types:**
- [ ] `lib/database.types.ts` — hand-written row types for our tables (skip supabase gen; over-engineered for MVP)

**Session hook:**
- [ ] `lib/auth.tsx` — `SessionProvider` + `useSession()` hook. Subscribes to `supabase.auth.onAuthStateChange`, exposes `session`, `profile`, `loading`

**Auth + onboarding screens:**
- [ ] `app/(auth)/_layout.tsx` — Stack for auth group
- [ ] `app/(auth)/sign-in.tsx` — email + password + submit
- [ ] `app/(auth)/sign-up.tsx` — email + password + DOB (text `YYYY-MM-DD`). Validate age ≥ 18 client-side and reject below. On success → onboarding
- [ ] `app/(auth)/onboarding.tsx` — 3 screens in sequence (name → what brings you here → current situation). On finish, write all answers to `users.profile_json` and route to `/(tabs)`

**Routing:**
- [ ] Root `app/_layout.tsx` — wrap in `SessionProvider`; use session state to gate `(tabs)` vs `(auth)` via `router.replace` in effect
- [ ] Home redirects to onboarding if `profile_json.name` missing (catches the "signed up, killed app mid-onboarding" edge case)

**Verify:**
- [ ] `tsc --noEmit` clean
- [ ] Metro boots with no import errors
- [ ] SQL reads correctly end-to-end (structurally — can't test live without Supabase creds)

**Commit + push.**

## Out of scope for Week 2

- Apple / Google social sign-in (later polish; email is enough for MVP)
- Magic link auth (needs deep linking config; password is simpler)
- Password reset flow (can ship post-launch)
- Profile avatar, display name edits, etc.
- Supabase CLI / `supabase db push` automation — SQL files in repo, user runs them in Supabase SQL editor
- Claude API / Edge Functions (Week 3)
- Crisis/safety classifier (Week 5)

## Review

**Status:** Auth + DB complete. Real Supabase project live with all 6 tables, RLS, trigger, and 4 seeded bots. Every auth path wired end-to-end in code.

**Shipped — client:**
- Deps added via `npx expo install`: `@react-native-async-storage/async-storage`, `react-native-url-polyfill`
- [lib/supabase.ts](lib/supabase.ts) — client with AsyncStorage adapter, `autoRefreshToken`, `persistSession`, `detectSessionInUrl: false` (RN has no URL session)
- [lib/database.types.ts](lib/database.types.ts) — hand-written row types for 4 primary tables (users, bots, conversations, messages). Each table entry has `Row`, `Insert`, `Update`, `Relationships: []`. Schema also declares `Views` + `Functions` as empty records so supabase-js `GenericSchema` constraint resolves (without `Relationships`/`Views`/`Functions`, Update args narrow to `never`)
- [lib/auth.tsx](lib/auth.tsx) — `SessionProvider` + `useSession()` hook exposing `{ session, profile, loading, refreshProfile }`. Subscribes to `supabase.auth.onAuthStateChange`; refetches `public.users` row on sign-in

**Shipped — screens:**
- [app/(auth)/_layout.tsx](app/(auth)/_layout.tsx) — Stack, headers off
- [app/(auth)/sign-in.tsx](app/(auth)/sign-in.tsx) — email + password via `signInWithPassword`
- [app/(auth)/sign-up.tsx](app/(auth)/sign-up.tsx) — email + password (8+ chars) + DOB `YYYY-MM-DD` with `ageAt()` helper rejecting <18 client-side. Routes to onboarding on success
- [app/(auth)/onboarding.tsx](app/(auth)/onboarding.tsx) — 3 questions (name / goal / situation) in one scrollable form, writes to `users.profile_json` then `refreshProfile()` and routes to `/(tabs)`
- [app/_layout.tsx](app/_layout.tsx) — wraps app in `SessionProvider`. `RouteGate` uses `useSegments()` + session state to redirect: no session → `/(auth)/sign-in`; session + in auth group (except onboarding) → `/(tabs)`
- [app/(tabs)/index.tsx](app/(tabs)/index.tsx) — Home reads `useSession()`; redirects to onboarding if session exists but `profile.profile_json.name` missing (recovers from "signed up, killed app mid-onboarding")
- [app/(tabs)/you.tsx](app/(tabs)/you.tsx) — added name + email display above free-tier card, plus Sign-out pressable calling `supabase.auth.signOut()` (makes auth flow testable without wiping data)

**Shipped — DB:**
- [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) — 6 tables (users, bots, conversations, messages, subscription_events, safety_events), `handle_new_user` trigger (auth.users insert -> public.users insert), RLS on all tables, bot seed with full v1 prompts (dollar-quoted `$H1$` / `$M1$` / `$Z1$` / `$R1$` to embed single quotes safely). Idempotent (`if not exists` + `on conflict do nothing` + `drop policy if exists`)
- Migration applied live: `Success. No rows returned` in SQL editor. Verified `bots` table contains all 4 rows with correct temperatures (0.9/0.6/0.4/0.7) and accent colors
- [.env](.env) populated with real `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (new-format `sb_publishable_...` key — supabase-js v2 treats it identically to the legacy anon JWT)

**Gotchas handled:**
- **Stale router types** (same as Week 1) — `.expo/types/router.d.ts` didn't know about `(auth)` routes; booted Metro briefly to regenerate, then stopped it
- **`never` error in onboarding `.update()`** — supabase-js's `GenericSchema` constraint requires `Relationships`, `Views`, `Functions`. My initial shortcut types omitted them, so generic inference fell through to `never`. Fixed by adding `Relationships: []` per table + `Views: Record<string, never>` + `Functions: Record<string, never>`
- **Unicode in migration SQL** — original prompts contained em dashes (U+2014), en dashes, an arrow. Monaco editor + Chrome clipboard round-trip mangled them to MacRoman artifacts (`,Äì` etc). Normalized the file to pure ASCII (`--`, `-`, `->`) with a one-time Python script. Prompts read identically

**Verified:**
- `npx tsc --noEmit` -> exit 0
- Metro boots clean (`Waiting on http://localhost:8081`)
- Schema + RLS + seed all present in Supabase (confirmed via Table Editor: 6 tables, 4 bots)

**Not yet tested (needs simulator/device):**
- Full sign-up -> onboarding -> home flow end-to-end
- Sign-in for returning user
- RLS behavior (only-own-rows) under real auth
- `handle_new_user` trigger firing on signup

**Deferred (per plan's out-of-scope):**
- Apple / Google / magic link auth
- Password reset
- Profile editing

**Next — Week 3:** Claude API wiring via Supabase Edge Function + streaming message UI.
