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

_To be filled in after completion._
