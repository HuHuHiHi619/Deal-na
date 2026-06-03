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

### User flow
1. Land on `/` → login (Google/Facebook OAuth via Supabase, or test user)
2. `/room` → create a room (topic + options) → redirected to `/room/[roomId]/lobby`
3. `/room/[roomId]vote` → vote on options, mark ready
4. `/room/[roomId]/result` → see winner

### Auth
- **`AuthProvider`** (`Guard/AuthProvider.tsx`) wraps the entire app in `layout.tsx`. It initializes the Supabase session on mount and listens to `onAuthStateChange`, syncing state into `useAuth` (Zustand store).
- **`AuthGuard`** (`Guard/AuthGuard.tsx`) is used on protected pages; redirects unauthenticated users to `/?redirect=...`.
- Auth state lives in `store/auth/useAuth.ts` (Zustand). Supports `facebook`, `google`, and `email` providers via `loginWithProvider`.

### Room lifecycle (`RoomSessionProvider`)
`src/app/room/[roomId]/RoomSessionProvider.tsx` is the central orchestrator, mounted via `layout.tsx` for all `/room/[roomId]/...` routes.

Lifecycle stages (all within a single `useEffect([roomId, userId])`):
1. Creates one Supabase channel `room:${roomId}`, registers all 8 handlers **before** `.subscribe()`
2. On first `SUBSCRIBED`: calls `POST /api/room/[roomId]` to join, then fetches all state slices (room, members, options, votes) via versioned fetches
3. Sets `isJoined = true`, tracks presence with `{ isReady: false }`
4. On subsequent `SUBSCRIBED` (reconnect): re-fetches all slices and re-tracks presence
5. Cleanup: untracks presence, clears all 5 stores, removes channel

Exposes `RoomSessionContext` consumed via `useRoomSession()`:
```ts
{
  isJoined: boolean;
  error: string | null;
  totalMembers: number;
  readyMembers: string[];             // presence status=true (lobby-ready)
  lockedMembers: string[];            // presence locked=true (vote-locked)
  memberNames: Map<string, string>;
  sendReady: ((name?) => Promise<boolean>) | null;   // lobby "I'm Ready" → status:true
  sendUnready: (() => Promise<boolean>) | null;       // status:false
  sendLock: ((name?) => Promise<boolean>) | null;     // vote "Lock In" → locked:true
  sendUnlock: (() => Promise<boolean>) | null;        // locked:false (Another Round reset, future)
}
```

`RoomGuard` (`component/room/RoomGuard.tsx`) gates page content on `isJoined`; shows auth-check → error → loading → children.

### Realtime (Supabase channels)
A **single channel** `room:${roomId}` is owned exclusively by `RoomSessionProvider`. All 8 `postgres_changes` handlers (room, room_members, options, votes) and one presence sync handler are registered on it.

**Reconciliation model:** realtime events are invalidation signals only — they trigger a versioned full-refetch (`setMembers`, `setOptions`, `setVotes`), never direct-patch the store. Votes are debounced 50 ms before refetch. Optimistic writes (`addVote`/`removeVote`) give immediate UI feedback; the subsequent refetch reconciles.

**Versioned fetches** (module-level counters) prevent stale responses from overwriting fresher data.

**Presence** tracks `{ user_id, name, status, locked }` per member, written into `RoomSessionContext` (not a store) on every sync event. **Two distinct booleans:** `status` = lobby-ready (gates the host's Start button), `locked` = vote-locked (when all members locked → advance to Result). They are separate because lobby→vote shares one `RoomSessionProvider`, so a single flag would leak lobby-readiness into the vote session. `track()` replaces the whole payload, so writes merge through a `selfMetaRef`. Presence is ephemeral and **not subject to RLS**.

### Zustand store structure
```
store/
  auth/useAuth.ts              # user, session — loginWithProvider, signOut
  useUiStore.ts                # loading/error flags keyed by UiKey — setLoading, setError, clearAll
 ```

**Write rules:** stores expose only full-replace setters (e.g. `setMembers`, `setOptions`, `setVotes`). No direct-patch methods. Only `RoomSessionProvider` calls these setters (via versioned fetches or presence sync). Optimistic `addVote`/`removeVote` are the sole exception.

`useRoomStore` is persisted with `zustand/middleware/persist` — `currentRoom` and `rooms` survive page refresh.

### API routes (`src/app/api/`)
All routes authenticate via `requireAuth(req)` (`lib/supabase.ts`): extracts `Authorization: Bearer <token>`, verifies with Supabase, returns `{ user, supabase }` or 401.

| Route | Method | Purpose |
|---|---|---|
| `/api/room/create` | POST | Create room + add creator to room_members + insert options |
| `/api/room/[roomId]` | GET | Fetch full room snapshot (bootstrap) |
| `/api/room/[roomId]` | POST | Join room (insert into room_members if not exists) |
| `/api/room/[roomId]/members` | GET | Fetch member user_id list |
| `/api/room/[roomId]/start` | POST | Host-only: set `started_at` timestamp |
| `/api/option/[roomId]` | GET | Fetch options for a room |
| `/api/option/[roomId]` | POST | Create options (bulk) |
| `/api/option/[roomId]/[optionId]` | DELETE | Delete option (creator-only via RLS) |
| `/api/vote` | POST | Create a vote |
| `/api/vote` | DELETE | Delete a vote |
| `/api/vote/result` | GET | Fetch vote results (get_vote RPC + raw votes) |

### Supabase / RLS gotchas
- **Never chain `.select()` onto an insert into a table whose SELECT policy depends on the row itself** (e.g. `is_member_of_room(room_id)`, `auth.uid() = created_by`). `.insert(...).select(...)` compiles to `INSERT … RETURNING`, and the returned row is filtered through the SELECT policy *in the same statement* — for a brand-new row this throws `42501 "new row violates row-level security policy"`, which misleadingly reads as an INSERT/`with_check` failure. **Insert first, then read back with a separate `.select().eq(...)`.** The `room_members` join in `api/room/[roomId]/route.ts` follows this; full write-up in `.claude/architecture-refactor/diagnosis-rls-insert-returning-42501.md`.
- Trusted server routes already authenticate via `requireAuth` and set `user_id` server-side; for RLS-heavy writes a service-role client is a safe alternative to forwarding the user JWT.
- Debugging RLS: a `public.debug_auth()` SQL fn returning `auth.uid()/auth.role()/auth.jwt()->>'sub'`, called via `supabase.rpc(...)` in a route, shows exactly what RLS sees — settles "is it auth or the policy?" in one request.

### Async action patterns
Two patterns coexist:

**`useAsyncAction`** (`hooks/useAsyncAction.tsx`) — used in hooks/components:
- Executes an action, manages `useUiStore` loading/error for a given key, calls `onSuccess`/`onError`

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
  - [ ] Create / Lobby / Vote / Results / Cleanup

## Doc update rule
After finishing each screen: update `CLAUDE.md` checklist only.
Write values and states, not actions. No prose.