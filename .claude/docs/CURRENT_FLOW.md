# CURRENT_FLOW.md — Realtime Lifecycle (as-built)

> **Updated for Stage 1 completion.**
> Sections marked `[STAGE 1]` reflect the new implementation. Unmarked sections describe pre-Stage-1 behaviour that is now superseded.
> The target architecture is documented in TARGET_RUNTIME_FLOW.md.

---

## Lifecycle Stages

### Stage 1 · Component Mount `[STAGE 1: REPLACED]`

**Previous owner:** `RoomPage` / `LobbyPage` each called `useRoomLifecycle` independently — two separate lifecycle instances per route.

**Current owner:** `RoomSessionProvider` in `room/[roomId]/layout.tsx`. One provider instance per route subtree. Pages (`lobby/page.tsx`, `page.tsx`) are now pure consumers of `useRoomSession()` context and Zustand selectors. `useRoomLifecycle` is no longer called by any room page.

- Layout mounts `RoomSessionProvider`. `isJoined=false` immediately. `RoomGuard` renders loading skeleton.
- `useEffect([roomId, userId])` queued — has not fired yet.
- No channel or network call has been made.

---

### Stage 2 · Auth Gate `[STAGE 1: REPLACED]`

**Owner:** `RoomSessionProvider` effect deps `[roomId, userId]`

- Effect checks `!userId || !token` from `useAuth` store — returns early without constructing a channel.
- No manual `isJoiningInternal` / `hasJoinedInternal` refs. Guard is structural: effect re-fires only when `roomId` or `userId` changes.
- Re-runs automatically when `userId` resolves (dep change). No polling.

---

### Stage 3 · Channel Construction + Subscribe `[STAGE 1: REPLACED]`

**Owner:** `RoomSessionProvider` — single `room:${roomId}` channel (was 4 channels).

- All 8 `.on()` handlers registered before `.subscribe()` (INV-4).
- `subscribePromise` wraps `.subscribe()` callback — resolves on `SUBSCRIBED`, rejects on `CHANNEL_ERROR`/`TIMED_OUT` with `removeChannel` before reject (INV-5).
- `joinRoomAPI` POST fires inside `.then()` of resolved `subscribePromise` — channel is live before the self-INSERT (INV-4).

**Previous Stage 3 (superseded):** `useRoom.joinRoom` fired the POST before any channel existed, inventing `started_at: now+24h` and calling `useOptionStore.setOptions` cross-slice. Both violations eliminated.

---

### Stage 4 · Bootstrap `[STAGE 1: REPLACED]`

**Owner:** `RoomSessionProvider` — runs after `subscribePromise` resolves.

```
Promise.all([
  POST /api/room/[roomId]         // join (idempotent)
  GET  /api/room/[roomId]         // full room snapshot → setCurrentRoom (INV-7: startedAt from server)
  GET  /api/room/[roomId]/members // member list → setMembers
  GET  /api/option/[roomId]       // options → setOptions
  GET  /api/vote/result?roomId=   // votes + results → setVotes + setVoteResults
])
```

All 5 calls run in parallel after SUBSCRIBED. All store writes happen after `Promise.all` resolves. `setIsJoined(true)` and `ch.track({ isReady: false })` fire after all writes. `channelRef.current = ch` set here — enables `sendReady`.

versionedFetch guards each slice (module-level counters: `membersVer`, `optionsVer`, `votesVer`, `roomVer`). Last call wins; stale responses are silently dropped.

**Previous Stage 4 (superseded):** 4 separate channels via `Promise.allSettled`; 3 surviving channels not cleaned up on partial failure; `subscribedRoomIdRef` set unconditionally.

---

### Stage 5 · Live Session `[STAGE 1: REPLACED]`

**Owner:** `RoomSessionProvider` channel handlers dispatch to versionedFetch functions.

No `onRoomJoined` callback. No `addMember(user.id)` optimistic patch. No page-level `fetchOption`. Bootstrap covers all initial data.

| Event | Handler | Setter |
|---|---|---|
| `room` UPDATE | `fetchRoom` | `setCurrentRoom` |
| `room_members` INSERT/DELETE | `fetchMembers` | `setMembers` (full replace) |
| `options` INSERT/DELETE | `fetchOptions` | `setOptions` (full replace) |
| `votes` INSERT/DELETE | `debouncedFetchVotes` (50ms) | `setVotes + setVoteResults` |
| `presence` sync | `syncPresence(ch)` | `setReady + setTotalMembers + setMemberNames` |

`sendReady` is now exposed via `RoomSessionContext` — `ReadyButton` reads it from `useRoomSession()` and calls `channelRef.current.track({ isReady: true })`.

**Previous Stage 5 (superseded):** `setOnRoomJoined` callback ran page-specific post-subscribe side effects. Deleted.

---

### Stage 6 · Live Session

**Owner:** 4 module-level `activeChannel` handles; 4 data stores

**Member list:**
- `room_members` INSERT → `useRoomMemberStore.addMember(payload.new.user_id)`.
- No DELETE handler. Departures are invisible.
- No initial fetch. Members who existed before this client subscribed are invisible.
- Initial state: only self (from optimistic `addMember` in Stage 5).

**Options:**
- Pre-populated at Stage 3 from `joinRoom` response.
- `options` INSERT → `addOption`. DELETE → `removeOption`. Map dedup on `id`.

**Votes:**
- NOT pre-populated at join. Votes cast before this client subscribed are invisible until `fetchVote` runs.
- `votes` INSERT → `addVote` (Map dedup). DELETE → `deleteVote`.
- `voteResults` is **only updated by `fetchVote`**, which is called after `createVote` / `deleteVote`. Realtime events do not trigger `fetchVote` independently.

**Ready / presence:**
- `sync` events → `setReady(readyUsers)`, `setTotalMembers(count)`, `setMemberNames(names)`.
- `join` / `leave` handlers are registered but empty — all logic is in `sync`.

---

### Stage 7 · Cleanup `[STAGE 1: REPLACED]`

**Owner:** `RoomSessionProvider` `useEffect` cleanup function — fires on unmount or when `[roomId, userId]` deps change.

```
aborted = true                          // guard all in-flight .then() callbacks
channelRef.current = null               // sendReady immediately fails safe
ch.untrack().catch(() => {})            // fire-and-forget
  .finally(() => supabase.removeChannel(ch))

// Synchronous store clear (INV-8)
useRoomMemberStore.getState().clearMembers()
useOptionStore.getState().setOptions([])
useVoteStore.getState().clearVotes()    // clears votesMap + voteResults
useRoomReadyStore.getState().clearReady()
useRoom.getState().exitRoom()           // clears currentRoom, sets isJoin=false
setIsJoined(false); setError(null)
```

React guarantees cleanup runs before the new effect fires when deps change — no window where two channels are live simultaneously.

**Tab close:** `exitRoom` sets `currentRoom: null` in localStorage. Bootstrap Stage 4 overwrites it before `isJoined=true`. Stale data never renders (`RoomGuard` holds skeleton).

**Previous Stage 7 (superseded):** pathname-watch effect (not a React cleanup), 4 separate `removeChannel` calls, `subscribedRoomIdRef` reset manually.

---

## Source of Truth Summary (current)

| Data domain | Source of truth | Problem |
|---|---|---|
| `room` metadata (`title`, `roomCode`, `status`) | Server — `POST /api/room/[roomId]` response | Only 3 fields returned; rest invented client-side |
| `room.started_at` | **Invented client-side** — `now + 24h` hardcoded in `joinRoom` | Always truthy in wrong casing, never truthy in correct casing |
| `room.expiredAt` | Same invented default | Never read from DB |
| Member list | Realtime-only after join | Starts empty; pre-existing members invisible; no DELETE handler |
| Options | `joinRoom` response + realtime INSERT/DELETE | No re-fetch path on event |
| Votes (`votesMap`) | Realtime INSERT/DELETE patches + optimistic `addVote` | Pre-join votes invisible |
| Vote results (`voteResults`) | `fetchVote` called post-own-write only | Diverges from `votesMap`; no event-triggered refetch |
| Ready / presence | Supabase Presence `presenceState()` | Self-track polling up to 3 s; convergence delay |

---

## Delivery Assumptions the Frontend Currently Makes

1. **At-least-once delivery is assumed not to happen.** `voteResults` has no dedup guard on duplicate INSERT echoes.
2. **In-order delivery is assumed.** `addVote` / `addOption` apply patches sequentially; no sequence number or timestamp check.
3. **No missed-event recovery.** If a realtime event is dropped (network gap), there is no fallback fetch to reconcile the gap.
4. **Initial state is complete at join time.** Options are assumed fully loaded from the `joinRoom` response. Members and votes are assumed to start at zero and grow via events — this is false for any room with pre-existing members or votes.
