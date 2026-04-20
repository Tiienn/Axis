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
