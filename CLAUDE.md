# CLAUDE.md
> Behavior rules for Claude Code. Read this file every session before any action.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build with Turbopack
npm run lint         # Run ESLint
npm run test         # Run tests with Vitest
npm run test:ui      # Vitest with browser UI
npm run test:coverage # Generate coverage report
```

Run a single test file:
```bash
npx vitest src/app/utils/validation.test.ts
```

## Environment Variables

Requires `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- NextAuth secrets (for OAuth providers: Facebook, Google)

## Architecture

**Deal Na** is a real-time group voting app. Users create a room with a topic and options, share the room link/QR code, and participants vote. The app uses Supabase Postgres + Realtime, NextAuth for OAuth, and Zustand for client state.

### Auth
- **`AuthProvider`** (`Guard/AuthProvider.tsx`) wraps the entire app in `layout.tsx`. It initializes the Supabase session on mount and listens to `onAuthStateChange`, syncing state into `useAuth` (Zustand store).
- **`AuthGuard`** (`Guard/AuthGuard.tsx`) is used on protected pages; redirects unauthenticated users to `/?redirect=...`.
- Auth state lives in `store/auth/useAuth.ts` (Zustand). Supports `facebook`, `google`, and `email` providers via `loginWithProvider`.


### Path aliases
`@/` maps to `src/` (configured in `vitest.config.ts` and Next.js).

### Testing
Tests use Vitest + jsdom + `@testing-library/react`. Test files sit next to the files they test (`*.test.tsx` / `*.test.ts`). The setup uses `globals: true`, so `describe`/`it`/`expect` don't need imports.

## AI Behavior Guidelines
- **Output Economy**: Be extremely concise. Use code diffs or targeted edits instead of re-printing entire files. No conversational fluff.
- **Security**: NEVER print actual secret values from `.env` files. Mask them as `KEY=******`.
- **ACTION** : NEVER push anything if i didn't approve.

## Git workflow
- One branch per task, cut fresh from latest `main`.
- Branch prefix = primary conventional-commit type (`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`).
- Finish → PR → squash-merge → delete branch → next task off updated `main`. No stacking unrelated tasks.
- `.husky/commit-msg` enforces this: blocks direct commits to `main`, and rejects a commit whose major type (feat/fix/refactor/perf) differs from the branch prefix. Supporting types (chore/docs/test/build/ci/style/revert) allowed anywhere. Bypass once: `git commit --no-verify`.

## Realtime issues
read this everytime when work with realtime
- @FLOW.md , @CONTEXT.md , @.claude/docs/RLS.json , @.claude/docs/RLS.json
- when finished realtime task you have to update changes at @FLOW.md or @CONTEXT.md ( show draft and wait for approve )

## UI workflow 
- READ @.claude/design/RE-DESIGN.md every time you work with ui
- Confetti Pop redesign status:
  - [x] Foundation — `src/app/theme.css` `@theme` tokens, `globals.css` cream bg, Fredoka via `next/font/google` in `layout.tsx` (`--font-fredoka` → `--font-display`), `component/decor/Confetti.tsx` (variant presets), `lib/cn.ts`
  - [x] Login — `page.tsx`; `TestUserLoginButton.tsx` split into `component/auth/EmailLoginForm.tsx` + `component/auth/DevQuickLogin.tsx`; `LoginButton.tsx` FB (sky-tint) / Google (sun-tint) chips
  - [x] Create — `room/page.tsx` cream shell + `Confetti variant="create"`; `topic/page.tsx` card, Enter/blur confirm; `OptionForm.tsx` numbered badges + `×` (min 2) + dashed add; `CreateRoomButton.tsx` `bg-brand-gradient`; `UserMenu.tsx` coral avatar; `RoomFormContext.tsx` options `['','']`; NEW `lib/optionColors.ts`
  - [x] Lobby — `room/[roomId]/lobby/page.tsx` cream shell + `Confetti variant="share"`; "Room ready" eyebrow; QR `rounded-4xl` card; ink "copy" link pill; `bg-mint-tint` joined panel (stacked `optionBg` avatars + pulsing mint dot); inline option add (cap 3); ink "start voting →" (host, `totalMembers >= 2`)
  - [x] Vote — shell `room/[roomId]/page.tsx` cream + `Confetti variant="vote"` (rose header dropped); `vote/page.tsx` (`VoteOptions`) "VOTING · LIVE" eyebrow + mint dot, `type-title` topic (via `useRoomQuery`), "N votes to spend", `bg-sun-tint` tip; per-option color via `optionColorAt`; `VoteOptionItem` white `rounded-2xl` + 2px `optionBorder` when `v>0` (dropped `isMyOption`); `VoteCountBadge` 44px solid `optionBg` chip (ink numeral on `sun`); `VoteButton` `tone` fill/ghost; `ReadyButton` `bg-brand-gradient`+`shadow-glow-coral` "lock it in ✓"; locked-in mint retoken
  - [x] Results — shell `room/[roomId]/result/page.tsx` cream + `Confetti variant="result"` (rose header dropped); `WinnerSection` winner card `bg-brand-gradient`+`shadow-glow-coral`, `type-display` title, `type-numeral` count, "out of N votes · %", 2 floating `bg-white/10–15` circles; tie → `bg-sun-tint` "It's a tie" panel + `·`-joined titles (no winner card); `VoteResultList` "FULL BREAKDOWN" eyebrow + `colorByOptionId` (option id → `optionColorAt` slot color); `VoteResultItem` white `rounded-xl` row = color dot + title + % + `optionText` count + h2.5 `optionBg` bar; actions: white `ShareResultButton` (`navigator.share` + clipboard fallback), ink `AnotherRoundButton` (tie → `stashAnotherRound` + `/room`, else blank `/room`), subtle text `ExitRoomButton`/`LogoutButton`; NEW `lib/anotherRound.ts` (sessionStorage seed) + `RoomFormContext` hydrates seed via effect
  - [x] Cleanup — `LoadingPage.tsx`/`ErrorPage.tsx` cream shell + `Confetti variant="login"` + white `rounded-3xl shadow-lg` card (ErrorPage CTA `bg-brand-gradient`+`shadow-glow-coral`, spinner `border-t-coral`); `room/[roomId]/layout.tsx` `bg-cream`; dead `lavender-*`/rose gradients dropped; removed inert `tailwind.config.js` + legacy `.btn-gradient`/`.vote-button`/`.trash-button` + `#e9aac2` from `globals.css`; shared option-color cycle = `lib/optionColors.ts`. Orphan `component/button/DeleteOptionButton.tsx` left as-is (unused, `rose-*`)

## Doc update rule
After finishing each screen: update `CLAUDE.md` checklist only.
Write values and states, not actions. No prose.