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

### Presence mechanics (impl — concept defs live in @CONTEXT.md)
- Presence payload per member: `{ user_id, name, status, locked }`. `locked` is the only live flag (vote-locked). `status` (ex lobby-ready) is sent but unread by the UI — dead until a lobby-ready gate returns.
- `name` is written into Presence on join (Lobby "N friends joined" initials) and re-sent whenever `locked` changes.
- `RoomSessionProvider` exposes `sendReady`/`sendUnready`/`readyMembers` — currently unused (paired with dead `status`).
- Reconnect recovery: on WebSocket re-establish, re-fetch all state slices and re-track Presence with last-known `locked`.

## UI workflow 
- READ @.claude/design/RE-DESIGN.md every time you work with ui


## Doc update rule
After finishing each screen: update `CLAUDE.md` checklist only.
Write values and states, not actions. No prose.