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
['room', roomId]       // { id, title, status, startedAt, ... }
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

## Implementation Stages (user writes the code)

### Stage 0 — New branch + install
```bash
git checkout main
git checkout -b refactor/tanstack-query-migration
npm install @tanstack/react-query
npm uninstall socket.io socket.io-client
```
Add `QueryClientProvider` wrapping the app in `src/app/layout.tsx`.

### Stage 1 — Write TQ query hooks
Create these four hooks in `src/app/hooks/`:
- `useRoomQuery(roomId, enabled)`
- `useMembersQuery(roomId, enabled)`
- `useOptionsQuery(roomId, enabled)`
- `useVotesQuery(roomId, enabled)` — returns `{ votes, formattedResult }`

Pattern for each:
```ts
useQuery({
  queryKey: ['room', roomId],
  enabled: enabled && !!session?.access_token,
  queryFn: async () => { /* fetch + throw on !res.ok */ }
})
```

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

⚠️ **Open:** `POST /api/room/${roomId}` sends no `Authorization` header. Verify `requireAuth` falls back to cookies, or add the Bearer token from `useAuth().session?.access_token`.

### Stage 3 — Update components
Replace every store selector with TQ hooks:
```ts
// before
const options = useOptionStore(s => s.optionsMap)
// after
const { data: options, isLoading } = useOptionsQuery(roomId, isJoined)
```

### Stage 4 — Fix Lobby count (the original bug)
```ts
// src/app/room/[roomId]/lobby/page.tsx
const { totalMembers } = useRoomSession()
```

### Stage 5 — Delete dead stores
Delete all 7 stores listed in D4 (except `useAuth`). Run `npm run build` — if it passes, done.

---

