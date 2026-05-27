# CURRENT_FLOW.md — Realtime Lifecycle (as-built)

> Updated through Stage 3 completion.
> `[STAGE 1]` = new implementation. `[STAGE 2]` = reconnect recovery. `[STAGE 3]` = direct-patch stores deleted.
> Unmarked = superseded pre-Stage-1 behaviour (historical reference only).
> Target architecture → TARGET_RUNTIME_FLOW.md

---

## Stage 1 · Component Mount `[STAGE 1]`

**Owner:** `RoomSessionProvider` in `room/[roomId]/layout.tsx`

- Single provider instance per route subtree.
- Pages (`lobby/page.tsx`, `page.tsx`) are pure consumers of `useRoomSession()` + Zustand selectors.
- `useRoomLifecycle` and `useRealtimeRoom` deleted in Stage 3 — were dead code (never called by any page after Stage 1).
- On mount: `isJoined=false`, `RoomGuard` renders loading skeleton, no channel or network call yet.

**Superseded:** `RoomPage` / `LobbyPage` each called `useRoomLifecycle` independently — two separate lifecycle instances per route.

---

## Stage 2 · Auth Gate `[STAGE 1]`

**Owner:** `RoomSessionProvider` effect `[roomId, userId]`

- Checks `!userId || !token` from `useAuth` store — returns early, no channel constructed.
- No manual `isJoiningInternal` / `hasJoinedInternal` refs.
- Re-runs automatically on `userId` resolve (dep change). No polling.

---

## Stage 3 · Channel Construction + Subscribe `[STAGE 1]`

**Owner:** `RoomSessionProvider` — single `room:${roomId}` channel (was 4 channels)

- All 8 `.on()` handlers registered **before** `.subscribe()` (INV-4).
- `subscribePromise` resolves on `SUBSCRIBED`, rejects on `CHANNEL_ERROR`/`TIMED_OUT` with `removeChannel` before reject (INV-5).
- `joinRoomAPI` POST fires inside `.then()` of resolved `subscribePromise` — channel live before self-INSERT (INV-4).

**Superseded:** `useRoom.joinRoom` fired POST before any channel, invented `started_at: now+24h`, called `useOptionStore.setOptions` cross-slice.

---

## Stage 4 · Bootstrap `[STAGE 1]`

**Owner:** `RoomSessionProvider` — runs after `subscribePromise` resolves

```
Promise.all([
  POST /api/room/[roomId]          // join (idempotent)
  GET  /api/room/[roomId]          // full snapshot → setCurrentRoom (INV-7: startedAt from server)
  GET  /api/room/[roomId]/members  // member list → setMembers
  GET  /api/option/[roomId]        // options → setOptions
  GET  /api/vote/result?roomId=    // votes + results → setVotes + setVoteResults
])
```

- All 5 calls parallel after `SUBSCRIBED`.
- Store writes happen after `Promise.all` resolves.
- `setIsJoined(true)` + `ch.track({ isReady: false })` fire after all writes.
- `channelRef.current = ch` set here — enables `sendReady`.
- `versionedFetch` guards each slice (module-level counters: `membersVer`, `optionsVer`, `votesVer`, `roomVer`). Stale responses silently dropped.

**Superseded:** 4 separate channels via `Promise.allSettled`; 3 surviving channels not cleaned up on partial failure; `subscribedRoomIdRef` set unconditionally.

---

## Stage 5 · Live Session `[STAGE 1]` `[STAGE 3]`

**Owner:** `RoomSessionProvider` channel handlers → versionedFetch → store setters

| Event | Handler | Setter |
|---|---|---|
| `room` UPDATE | `fetchRoom` | `setCurrentRoom` |
| `room_members` INSERT/DELETE | `fetchMembers` | `setMembers` (full replace) |
| `options` INSERT/DELETE | `fetchOptions` | `setOptions` (full replace) |
| `votes` INSERT/DELETE | `debouncedFetchVotes` (50ms) | `setVotes + setVoteResults` |
| `presence` sync | `syncPresence(ch)` | `setReady + setTotalMembers + setMemberNames` |

- No `onRoomJoined` callback. No `addMember(user.id)` optimistic patch. No page-level `fetchOption`.
- `sendReady` exposed via `RoomSessionContext` → `ReadyButton` calls `channelRef.current.track({ isReady: true })`.
- `[STAGE 3]` — `createVote` and `deleteVote` no longer call `fetchVote()` after the optimistic write. Debounced realtime event is the sole `voteResults` reconciliation path (RC-2, RC-3 closed by construction).
- `[STAGE 3]` — `result/page.tsx` no longer calls `fetchVote()` on mount; `voteResults` is populated by provider bootstrap.

**Superseded:** `setOnRoomJoined` callback for page-specific post-subscribe side effects.

---

## Stage 6 · Live Session (pre-Stage-1, superseded — code deleted in Stage 3)

**Owner:** 4 module-level `activeChannel` handles; 4 data stores — **all 4 realtime store files deleted**

| Domain | Behaviour | Problem |
|---|---|---|
| Members | INSERT → `addMember`. No DELETE handler. No initial fetch. | Pre-existing members invisible; starts empty. |
| Options | Pre-populated from `joinRoom` response + realtime INSERT/DELETE. | No re-fetch path on event. |
| Votes | Realtime INSERT/DELETE patches + optimistic `addVote`. `voteResults` updated only by `fetchVote` post-own-write. | Pre-join votes invisible; `voteResults` diverges from `votesMap`. |
| Ready / presence | `sync` → `setReady`, `setTotalMembers`, `setMemberNames`. `join`/`leave` handlers registered but empty. | Self-track polling up to 3s convergence delay. |

---

## Stage 7 · Cleanup `[STAGE 1]`

**Owner:** `RoomSessionProvider` `useEffect` cleanup — fires on unmount or `[roomId, userId]` dep change

```js
aborted = true                           // guard all in-flight .then() callbacks
channelRef.current = null                // sendReady immediately fails safe
ch.untrack().catch(() => {})
  .finally(() => supabase.removeChannel(ch))

// Synchronous store clear (INV-8)
useRoomMemberStore.getState().clearMembers()
useOptionStore.getState().setOptions([])
useVoteStore.getState().clearVotes()     // clears votesMap + voteResults
useRoomReadyStore.getState().clearReady()
useRoom.getState().exitRoom()            // clears currentRoom, sets isJoin=false
setIsJoined(false); setError(null)
```

- React guarantees cleanup runs before new effect fires on dep change — no window where two channels are live simultaneously.
- **Tab close:** `exitRoom` sets `currentRoom: null` in localStorage. Bootstrap (Stage 4) overwrites before `isJoined=true`. Stale data never renders.

**Superseded:** pathname-watch effect (not a React cleanup), 4 separate `removeChannel` calls, manual `subscribedRoomIdRef` reset.

---

## Source of Truth Summary (historical — all problems below resolved by Stage 1–3)

| Domain | Pre-Stage-1 Source | Problem | Resolution |
|---|---|---|---|
| `room` metadata (`title`, `roomCode`, `status`) | `POST /api/room/[roomId]` response | Only 3 fields returned; rest invented client-side | Stage 1: `GET /api/room/[roomId]` full snapshot |
| `room.started_at` | **Invented** — `now + 24h` hardcoded in `joinRoom` | Always truthy in wrong casing; never truthy in correct casing | Stage 1: `startedAt: null` until server UPDATE event |
| `room.expiredAt` | Same invented default | Never read from DB | Stage 1: full snapshot from `fetchRoom` |
| Member list | Realtime-only after join | Starts empty; pre-existing members invisible; no DELETE handler | Stage 1: `fetchMembersAPI` at bootstrap + DELETE handler |
| Options | `joinRoom` response + realtime INSERT/DELETE | No re-fetch path on event | Stage 1: `fetchOptionsAPI` at bootstrap; Stage 3: direct-patch store deleted |
| `votesMap` | Realtime INSERT/DELETE + optimistic `addVote` | Pre-join votes invisible | Stage 1: `fetchVotesAPI` at bootstrap; Stage 3: old store deleted |
| `voteResults` | `fetchVote` post-own-write only | Diverges from `votesMap`; no event-triggered refetch | Stage 3: `fetchVote` removed; debounced realtime event is sole path |
| Ready / presence | Supabase Presence `presenceState()` | Self-track polling up to 3s convergence delay | Stage 1: polling deleted; `syncPresence` on `sync` event only |

---

## Delivery Assumptions (historical — resolved by Stage 1–3)

1. **At-least-once delivery not handled** — `voteResults` has no dedup guard on duplicate INSERT echoes. ✅ Resolved Stage 3: full-replace `setVotes`/`setVoteResults` from debounced fetch is idempotent on duplicate events.
2. **In-order delivery assumed** — `addVote`/`addOption` apply patches sequentially; no sequence number or timestamp check. ✅ Resolved Stage 3: direct-patch stores deleted; versionedFetch last-call-wins ordering replaces per-event ordering dependency.
3. **No missed-event recovery** — dropped realtime events have no fallback fetch to reconcile. ✅ Resolved Stage 2: `reconnectBootstrap()` re-fetches all slices on WebSocket reconnect.
4. **Initial state assumed complete at join** — Members and votes assumed to start at zero and grow via events; false for rooms with pre-existing data. ✅ Resolved Stage 1: bootstrap fetches all slices before `isJoined=true`.