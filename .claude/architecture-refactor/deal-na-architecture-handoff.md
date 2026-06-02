# Handoff: Deal Na — Architecture Redesign

## One-line summary
Replace all Zustand server-state stores with TanStack Query + invalidate-on-realtime; keep Zustand for auth only; move presence into RoomSessionContext.

---

## All Confirmed Decisions

### D1 — Lobby member count: **Presence**
`totalMembers` comes from Supabase Presence, not `room_members` rows. Lobby reads from `useRoomSession()`.

### D2 — Join gate: **RoomSessionProvider POSTs join, sets `isJoined`; TQ queries use `enabled: isJoined`**

### D3 — Realtime: **invalidate and refetch, no cache patching**
`queryClient.invalidateQueries({ queryKey: [key, roomId] })` on every postgres_changes event. Optimistic vote updates kept as commented-out code.

### D4 — Zustand fate

| Store | Fate |
|---|---|
| `useAuth` | **Keep** |
| `useRoomStore` | **Delete** → `['room', roomId]` TQ query |
| `useRoomMemberStore` | **Delete** → `['members', roomId]` TQ query |
| `useOptionStore` | **Delete** → `['options', roomId]` TQ query |
| `useVoteStore` | **Delete** → `['votes', roomId]` TQ query |
| `useRoomReadyStore` | **Delete** → `RoomSessionContext` |
| `useUiStore` | **Delete** → TQ owns loading/error; residual flags become local state |
| `useRoomForm` | **Delete** → local React state |

### D5 — Presence: **React context inside RoomSessionProvider**

### D5a — Navigation: **consuming component watches context, not provider**

### D6 — Query keys (canonical)
```ts
['room', roomId]       // Room (snake_case fields: id, title, status, created_by, started_at, ...)
['members', roomId]    // string[]  — user_ids only; names come from presence
['options', roomId]    // Option[]
['votes', roomId]      // { votes: Vote[], formattedResult: VoteResult[] }
```

### D7 — queryClient access: **`useQueryClient()` hook inside RoomSessionProvider**

### D8 — Another Round reset
Realtime DELETE events on `votes` → invalidate `['votes', roomId]` automatically. Presence `isReady` reset via new `sendUnready()` action — each client calls it when navigating back for another round.

### D9 — Error handling
- All TQ queries: default retry (3x)
- Join POST: no retry — explicit catch → set `error` in context → `RoomGuard` shows error

### D10 — Migration: **new branch from `main`**
Branch: `refactor/tanstack-query-migration`. First commit installs TQ and removes dead `socket.io` deps.

### D11 — Exit room: **`removeQueries` (clear cache), not `invalidateQueries`**
On exit, all 4 room query keys are removed from cache. User leaves the room and history is not kept.

### D12 — Central types: `src/app/types/index.ts`
All domain types (`Room`, `Option`, `Vote`, `VoteResult`, `VotesQueryData`) are defined here. Components and hooks import from `@/app/types`.

### D13 — `QueryClientProvider` must be in a Client Component
`QueryClient` is a class instance and cannot be passed from Server → Client components. Owned by `src/app/Providers.tsx` (`'use client'`), which wraps `AuthProvider` in the root layout.

---

## Final `RoomSessionContext` Shape

```ts
interface RoomSessionContextValue {
  isJoined: boolean;
  error: string | null;
  totalMembers: number;
  readyMembers: string[];             // userIds with isReady=true
  memberNames: Map<string, string>;   // userId → display name
  sendReady: ((name?: string) => Promise<boolean>) | null;
  sendUnready: (() => Promise<boolean>) | null;
}
```

---

## Implementation Stages

### Stage 0 — New branch + install ✅ DONE
```bash
git checkout main
git checkout -b refactor/tanstack-query-migration
npm install @tanstack/react-query
npm uninstall socket.io socket.io-client
```

### Stage 1 — Write TQ query hooks ✅ DONE
Four query hooks in `src/app/hooks/query/`:
- `useRoomQuery(roomId, enabled)` → `Room`
- `useMembersQuery(roomId, enabled)` → `string[]`
- `useOptionsQuery(roomId, enabled)` → `Option[]`
- `useVoteQuery(roomId, enabled)` → `{ votes: Vote[], formattedResult: VoteResult[] }`

Four mutation hooks in `src/app/hooks/mutation/`:
- `useVoteMutations(roomId)` — `addVote`, `removeVote`; invalidates `['votes', roomId]`
- `useOptionMutations(roomId)` — `addOption`; invalidates `['options', roomId]`
- `useCreateRoomMutation()` — sets `['currentRoom']` cache, navigates to lobby
- `useExitRoomMutation({ roomId })` — **removes** all 4 room keys (D11), navigates to `/room`

### Stage 2 — Rewrite `RoomSessionProvider` ✅ DONE
New responsibilities only:
1. Create Supabase channel
2. POST join → set `isJoined = true`
3. Realtime handlers call `queryClient.invalidateQueries(...)` — no store writes
4. Sync presence → expose via context
5. Expose `sendReady`, `sendUnready`

**What was implemented:**
- `POST /api/room/${roomId}` replaces direct upsert; throws on non-ok → `RoomGuard` shows error (D9)
- `channelRef.current = channel` assigned before `.subscribe()` — no channel leak on early unmount
- 4 `postgres_changes` handlers: `votes`, `room_members`, `options`, `room` — all invalidate via TQ (D3)
- Presence sync updates `totalMembers`, `readyMembers`, `memberNames` only — no query invalidation
- `sendReady(name?)` / `sendUnready()` both use `channel.track()` — `sendUnready` uses `status: false` not `untrack()`
- Context shape matches spec exactly (D5)
- Layout (`room/[roomId]/layout.tsx`) uses `React.use(params)` for async params (Next.js 15)

⚠️ **Open:** `POST /api/room/${roomId}` sends no `Authorization` header. Verify `requireAuth` falls back to cookies, or add the Bearer token from `useAuth().session?.access_token`.

### Stage 3 — Update components + type extraction ✅ DONE
`npm run build` passes.

**Types extracted** to `src/app/types/index.ts`: `Room`, `Option`, `Vote`, `VoteResult`, `VotesQueryData`. Removed inline declarations from components and hooks.

**All components migrated to TQ hooks:**

| Component / Page | Before | After |
|---|---|---|
| `lobby/page.tsx` | Zustand stores | `useRoomQuery`, `useOptionsQuery`, `useOptionMutations`, `useRoomSession` |
| `vote/page.tsx` | Zustand stores | `useOptionsQuery`, `useVoteQuery`, `useMembersQuery`, `useVoteMutations`, `useRoomSession` |
| `result/page.tsx` | Zustand stores + `useUiStore` | `useRoomQuery`, `useVoteQuery`, `useVoteResult` |
| `ExitRoomButton` | `useCurrentRoom` (stale cache) | `useParams()` + `useExitRoomMutation` |
| `ShareRoom` | `useUiStore` for popup/loading | local `useState`, `onClose` prop |
| `room/page.tsx` | `useUiStore.isPopup` | local `useState(false)` |
| `layout.tsx` (root) | `QueryClient` in Server Component | moved to `Providers.tsx` client component (D13) |

**Bug fixes found during Stage 3:**
- `useVoteQuery` was calling `GET /api/room/${roomId}/votes` (no GET handler) → fixed to `/votes/results`
- `votes/route.ts` had `optionId` in URL params (not in path) → fixed to read from request body
- `room/[roomId]/page.tsx` used camelCase `startedAt`, `createdBy` → fixed to snake_case (matches `Room` type)
- `actionWrapper.ts` imported deleted `useRoomStore` via `getRequiredContext` → dead function removed
- `QueryClient` instantiated in Server Component → moved to `Providers.tsx`

### Stage 4 — Fix Lobby count ✅ DONE (completed as part of Stage 3)
```ts
// src/app/room/[roomId]/lobby/page.tsx
const { totalMembers } = useRoomSession()
```

### Stage 5 — Delete dead stores ✅ DONE (completed as part of Stage 2)
All 7 stores deleted. `useAuth` kept. `useUiStore` still present but only used by `useAsyncAction` and `actionWrapper` (dead utilities). `npm run build` passes.

**Remaining `useUiStore` usage** (2 files, both dead utilities — no live component calls these):
- `src/app/utils/actionWrapper.ts` — no longer imported by any component
- `src/app/hooks/useAsyncAction.tsx` — no longer imported by any component

These can be deleted in a cleanup pass after confirming nothing calls them.

---

## What's Left

1. **Manual testing** — run the app and exercise the full flow:
   - Create room → lobby shows correct member count (D1)
   - Guest joins → both see updated `totalMembers`
   - Vote → result page shows correct ranked results
   - Exit room → cache cleared, clean re-enter
   - Another round → votes reset, presence `isReady` reset

2. **Verify `POST /api/room/${roomId}` auth** (open from Stage 2) — check if `requireAuth` falls back to cookies or needs `Authorization: Bearer` header added in `RoomSessionProvider`.

3. **Cleanup pass** (optional) — delete `useAsyncAction.tsx`, `actionWrapper.ts`, `context.ts`, `useCurrentRoom.tsx` once confirmed unreachable.

---

## ✅ RESOLVED — guest 42501 on join was `INSERT ... RETURNING` vs a SELECT policy
**Symptom:** with RLS enabled, guest join → `POST /api/room/[roomId]` → 500, `code 42501 "new row violates row-level security policy for table room_members"`. Host unaffected.

**It was NOT** RLS misconfig, `auth.uid()`, or the `sb_publishable_` signing keys. A `debug_auth()` rpc proved that at insert time `auth.uid()` == `role authenticated` == the `user_id` being inserted, and the live `room_members` INSERT policy is exactly `with_check (auth.uid() = user_id)` — i.e. the check was mathematically `true` yet still threw.

**Real root cause:** the join route chained `.insert(...).select(...)`, which PostgREST compiles to `INSERT ... RETURNING`. The returned row is filtered through the `room_members` **SELECT** policy `is_member_of_room(room_id)` (a `SECURITY DEFINER` fn) in the same statement, which fails for a brand-new joiner and surfaces as 42501. The host's owner insert (`create/route.ts:50`) never chained `.select()`, so it never tripped it.

**Fix (`api/room/[roomId]/route.ts`):** split the write from the read — bare `.insert(...)`, then a standalone `.select().eq().eq().single()` read-back after the row exists. Live policies matched RLS.json, no policy change needed. (Diagnostic `public.debug_auth()` was dropped.)

> Pattern rule: never chain `.select()` onto an insert into a table whose SELECT policy depends on the row's own membership/ownership (`is_member_of_room`, `auth.uid() = created_by`, …). Insert, then select back separately.

---

## ✅ RESOLVED — guest stuck on "locked in / calculating" entering vote page

**Symptom:** Guest presses *Ready* in lobby → host starts → guest lands on vote page showing **"You're locked in"** or **"All votes locked in! Calculating results…"** and hangs. Hard refresh fixed it.

**Root cause — one presence boolean (`status`) meant two things:** "lobby-ready" *and* "vote-locked." Lobby→vote stays inside the **same** `RoomSessionProvider`, so `status: true` carried over to the vote page; the on-mount `sendUnready()` reset was racy/fire-and-forget, so stale `readyMembers` fired the locked screen / auto-navigate before it propagated.

**Fix (chosen: B — separate the states):** added a distinct `locked` presence field for the vote session; `status` stays = lobby-ready.
- `RoomSessionProvider.tsx`: `PresenceMeta.locked`; context exposes `lockedMembers` + `sendLock`/`sendUnlock`; a `selfMetaRef` merges fields across `track()` calls (track replaces the whole payload); presence sync builds both `readyList` (status) and `lockedList` (locked).
- `vote/page.tsx`: reads `lockedMembers` (starts empty on entry → no false trigger); racy on-mount `sendUnready` deleted.
- `ReadyButton.tsx`: "Lock In My Votes" calls `sendLock`.
- Lobby unchanged (still `status` / `sendReady` / `readyMembers`).

**Still deferred — Another Round (D8):** NOT fixed by this. On re-entry the same provider carries `locked: true`, so it would instant-navigate to result; needs a *confirmed-reset* gate (don't navigate until the client observes its own `locked` flip to `false` this round). No Another Round UI exists yet.
