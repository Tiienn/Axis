# Week 7 Plan — Observability + polish

Goal: before we ship to real users, know when things break (Sentry) and know what users actually do (PostHog). Plus clean up the two rough edges from prior weeks: no retry on Anthropic 5xx, and the You-tab "Settings · Subscription · Terms · Privacy" stub that goes nowhere.

**Prereqs (external, from Week 0 checklist):** Sentry project created, PostHog project created. Both DSN/keys go in `.env`. Code can scaffold without them — SDKs no-op if the DSN/key is empty, so no one breaks.

## Key decisions

1. **Sentry + PostHog only — no other analytics stack.** Two tools covers crashes + events. Don't need Mixpanel/Amplitude/etc on top.

2. **Event schema stays small.** 6 events, 1 user property. More is noise; we can add later. Events are the verbs, not the nouns:
   - `sign_up` (on successful auth signup)
   - `sign_in` (on successful auth sign-in, not onboarding)
   - `onboarding_completed` (after writing profile_json)
   - `message_sent` (props: `bot_id`, `classifier_level` — fires on every user send that reaches the edge function)
   - `paywall_shown` (when paywall modal opens — props: `trigger` = 'rate_limit' | 'manual')
   - `crisis_triggered` (when classifier returns 'crisis' — **no message content**, just the event)

   User property set on identify: `subscription_status` ('free' | 'pro' | 'lifetime').

3. **PII posture:** identify user by their auth UUID. No email, no name, no profile_json, no message bodies. Sentry scrubs too.

4. **Edge function PostHog too — but only for `crisis_triggered` and `message_sent`.** Reason: classifier_level lives server-side, and crisis count is a metric we need even if the client crashes. Direct HTTP POST to PostHog capture endpoint; no SDK install needed in Deno.

5. **Anthropic retry: 1 retry, 1s backoff, 5xx only.** Simplest version that catches transient blips. 4xx (including rate limits) not retried — those are bugs, not transient.

6. **Settings screen scope — minimum real:**
   - App version (read from `expo-application`)
   - "Manage subscription" → opens paywall modal if free, no-op + tooltip if paid (real portal link waits for 6B)
   - "Privacy Policy" + "Terms" — external links to placeholder URLs (axis.app/privacy, axis.app/terms). Deferred to real docs in Week 9 polish
   - "Delete my account" — opens Alert with "Email support@axis.app" (real delete-account flow post-launch)
   - "Sign out" — moved here from the You-tab root

   Structure: simple vertical list of rows. No section headers.

## Tasks

**Deps:**
- [ ] `npx expo install @sentry/react-native` + `posthog-react-native` + `expo-application`

**Env:**
- [ ] `.env.example` — already has `EXPO_PUBLIC_SENTRY_DSN` and `EXPO_PUBLIC_POSTHOG_KEY`; add `EXPO_PUBLIC_POSTHOG_HOST` (default `https://us.i.posthog.com`)
- [ ] User pastes real DSN + PostHog key into `.env` (I can't do this)
- [ ] Add `POSTHOG_API_KEY` + `POSTHOG_HOST` to Supabase edge function secrets (user, via dashboard — same flow as `ANTHROPIC_API_KEY`)

**Sentry:**
- [ ] `lib/sentry.ts` — init helper reading from `EXPO_PUBLIC_SENTRY_DSN`, no-op if empty
- [ ] `app/_layout.tsx` — call `initSentry()` before font loading
- [ ] Wrap `RootLayout` default export with `Sentry.wrap()` for native crash capture

**PostHog (client):**
- [ ] `lib/analytics.ts` — thin wrapper: `track(event, props?)`, `identify(userId, props?)`, `reset()`. Reads `EXPO_PUBLIC_POSTHOG_KEY`, no-op if empty. Uses `posthog-react-native`'s singleton pattern
- [ ] `lib/auth.tsx` — on session-resolved, call `identify(user.id, { subscription_status })`. On sign-out, call `reset()`
- [ ] `app/(auth)/sign-up.tsx` — `track('sign_up')` after successful signUp
- [ ] `app/(auth)/sign-in.tsx` — `track('sign_in')` after successful sign-in
- [ ] `app/(auth)/onboarding.tsx` — `track('onboarding_completed')` after profile write
- [ ] `app/chat/[botId].tsx` — `track('message_sent', { bot_id })` on send (classifier_level logged server-side since client doesn't know it)
- [ ] `app/paywall.tsx` — `track('paywall_shown', { trigger })` on mount. Add `trigger` param via route params ('rate_limit' | 'manual')
- [ ] `app/chat/[botId].tsx` — pass `trigger: 'rate_limit'` when routing to paywall from 429

**PostHog (server):**
- [ ] `supabase/functions/send-message/index.ts` — add `capture(event, distinctId, props)` helper: `POST https://${host}/capture/` with `{api_key, event, distinct_id, properties}`. Fire-and-forget (no await on the critical path — use `.catch()` to swallow errors)
- [ ] Fire `message_sent` with `{bot_id, classifier_level}` after classifier runs
- [ ] Fire `crisis_triggered` inside the crisis branch

**Anthropic retry:**
- [ ] `supabase/functions/send-message/index.ts` — wrap `callClaude()` in a retry loop: 1 retry, 1000ms wait, only on status >= 500. Surface the error on second failure as before (502 to client)
- [ ] Same wrapping for `updateMemorySummary()` and `classifyMessage()` — one shared `fetchWithRetry()` helper is cleanest

**Settings screen:**
- [ ] `app/settings.tsx` — new screen, presented as stack route (not modal). Rows: Manage subscription / Privacy / Terms / Delete account / Sign out
- [ ] `app/_layout.tsx` — register `<Stack.Screen name="settings" options={{ title: 'Settings', headerShown: true, headerStyle, headerTintColor }} />`
- [ ] `app/(tabs)/you.tsx` — replace the "Settings · Subscription · Terms · Privacy" stub text with a single "Settings" pressable that routes to `/settings`. Remove inline Sign out (moves into Settings)

**Verify:**
- [ ] `tsc --noEmit` clean
- [ ] `supabase functions deploy send-message --no-verify-jwt`
- [ ] Smoke test: send a message, see `message_sent` in PostHog live view. Trigger a crisis message, see `crisis_triggered` with bot_id but no content
- [ ] Deliberately cause an error (e.g. set Anthropic key invalid for 30s) — confirm Sentry captures it

**Commit + push.**

## Out of scope for Week 7

- Expo Push notifications → requires native build, do with 6B
- Real privacy policy + terms copy → Week 9 polish
- Real delete-account flow (needs cascade + data export) → post-launch
- RevenueCat customer portal link on Settings → 6B
- PostHog feature flags / A/B tests → post-launch
- Session replay → not useful yet
- Sentry user feedback widget → post-launch
- Server-side Sentry in the edge function → deferred; Supabase function logs catch the critical failures, and PostHog on the happy path is what we need

## Review

**Status:** Code shipped + edge function redeployed. Sentry + PostHog SDKs wired but inert until user pastes DSN/keys into `.env` + Supabase secrets. Retry + settings screen are live regardless.

**Shipped — deps:**
- `@sentry/react-native@~7.2.0`, `posthog-react-native@^4.42.4`, `expo-application@~7.0.8` via `npx expo install`
- `app.json` auto-updated with `@sentry/react-native` config plugin entry

**Shipped — observability libs:**
- [lib/sentry.ts](lib/sentry.ts) — `initSentry()` helper + re-exports the SDK. No-ops if DSN empty. `sendDefaultPii: false`, `tracesSampleRate: 0`
- [lib/analytics.ts](lib/analytics.ts) — thin PostHog wrapper with `initAnalytics`, `track`, `identify`, `resetAnalytics`. Module-scope singleton client; no-ops if key empty

**Shipped — wiring:**
- [app/_layout.tsx](app/_layout.tsx) — calls `initSentry()` + `initAnalytics()` at module load. `RootLayout` now wrapped with `Sentry.wrap()` for crash capture. Also registered new `settings` stack screen
- [lib/auth.tsx](lib/auth.tsx) — on profile load, calls `identify(userId, { subscription_status })`. On sign-out (onAuthStateChange with null session), calls `resetAnalytics()`
- [app/(auth)/sign-up.tsx](app/(auth)/sign-up.tsx) — `track('sign_up')` on successful signUp
- [app/(auth)/sign-in.tsx](app/(auth)/sign-in.tsx) — `track('sign_in')` on successful sign-in
- [app/(auth)/onboarding.tsx](app/(auth)/onboarding.tsx) — `track('onboarding_completed')` after profile write
- [app/chat/[botId].tsx](app/chat/%5BbotId%5D.tsx) — `track('message_sent', { bot_id })` on send. Rate-limit routing now passes `trigger: 'rate_limit'` to paywall
- [app/paywall.tsx](app/paywall.tsx) — `track('paywall_shown', { trigger })` in useEffect, reads `trigger` from route params (default `'manual'`)

**Shipped — edge function:**
- [supabase/functions/send-message/index.ts](supabase/functions/send-message/index.ts):
  - `fetchWithRetry()` — one shared helper. 1 retry, 1s wait, 5xx only. Wraps all 3 Anthropic calls (main Sonnet, memory summary, classifier)
  - `capture()` — fire-and-forget POST to PostHog capture endpoint. No-ops if `POSTHOG_API_KEY` secret missing. Reads from `POSTHOG_HOST` secret (default `https://us.i.posthog.com`)
  - `message_sent` fires right after conversation upsert succeeds, properties `{ bot_id, classifier_level }`. Fires for every request that reaches the core flow regardless of branch (crisis / distress / none)
  - `crisis_triggered` fires inside the crisis branch, property `{ bot_id }`. No message content — count is the metric
- Redeployed via `supabase functions deploy send-message --no-verify-jwt`

**Shipped — Settings:**
- [app/settings.tsx](app/settings.tsx) (NEW) — grouped list of rows: Manage subscription / Privacy / Terms / Delete account / Sign out. Paid users tapping "Manage subscription" see an Alert explaining App Store/Play Store manage (real portal in 6B). Free users route to paywall with `trigger: 'manual'`. Delete account shows Alert with `support@axis.app` (real flow post-launch). Privacy + Terms open placeholder URLs (`axis.app/privacy` + `axis.app/terms`). Version pulled via `Application.nativeApplicationVersion`
- [app/(tabs)/you.tsx](app/(tabs)/you.tsx) — replaced the "Settings · Subscription · Terms · Privacy" stub + inline Sign-out with a single "Settings" row pressable. All account actions now flow through `/settings`
- [app/_layout.tsx](app/_layout.tsx) — registered `<Stack.Screen name="settings" options={{ headerShown: true, headerStyle, headerTintColor }} />` (not modal — pushed on the stack so the back chevron works naturally)

**Env:**
- [.env.example](.env.example) — added `EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` client-side, plus `POSTHOG_API_KEY=` + `POSTHOG_HOST=https://us.i.posthog.com` server-side

**Gotchas hit + fixed:**
- **PostHog TS types rejected `undefined` in Props** — my initial `Record<string, string | number | boolean | null | undefined>` conflicted with PostHog's `PostHogEventProperties` (which requires `JsonType`, excluding `undefined`). Dropped `| undefined` from the Props type; callers can still pass partial objects, they just can't pass literal `undefined` values

**Verified:**
- `npx tsc --noEmit` -> exit 0
- `supabase functions deploy send-message --no-verify-jwt` -> "Deployed Functions on project uttjrnqgeysuhvtjddgv: send-message"
- SDKs are no-op stubs until the user pastes real DSN + keys — code is safe to ship as-is; observability turns on when secrets land

**Not yet tested (requires user env setup):**
- Sentry crash capture with real DSN
- PostHog `message_sent` + `crisis_triggered` in the live view
- Retry behavior on Anthropic 5xx (hard to simulate)
- Settings screen navigation on simulator/device (verified in code only)
- `Application.nativeApplicationVersion` returns a real string on native (on web it might be null -> "0.0.0")

**Pending user actions (blockers for full observability):**
1. Ensure Sentry + PostHog accounts from Week 0 checklist exist (spin up now if not)
2. Paste DSN + PostHog key into `.env`:
   - `EXPO_PUBLIC_SENTRY_DSN`
   - `EXPO_PUBLIC_POSTHOG_KEY`
3. Paste server secrets into Supabase Edge Function Secrets dashboard:
   - `POSTHOG_API_KEY` (same value as the client key for Capture API)
   - `POSTHOG_HOST` (only if not using default `https://us.i.posthog.com`)

**Deferred (per plan's out-of-scope):**
- Push notifications (native-only) -> 6B or post-6B sprint
- Real privacy/terms copy -> Week 9 polish
- Real delete-account cascade -> post-launch
- RevenueCat customer portal link on Settings -> 6B
- Server-side Sentry in edge function -> Supabase logs catch critical failures; revisit if needed

**Next — Week 6B or Week 8:** either circle back to IAP once Apple Developer account is active + EAS dev-client builds, or push ahead to Week 8 (error polish, SSE streaming if warranted, onboarding tweaks, app icon).
