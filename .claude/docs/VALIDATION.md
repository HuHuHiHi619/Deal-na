# VALIDATION.md — Architectural Review Record

> Documents how the target architecture satisfies the frozen invariants, what risks remain,
> what tradeoffs were explicitly accepted, what assumptions are unverified, and what
> consistency guarantees the architecture cannot make.
> This document is for future architectural review context only.
> Last audited: 2026-05-27. **Stage 1 verified: all INV-1 through INV-8 structurally enforced.**

---

## 1. Invariant Preservation

### INV-1 — `requireAuth` on every API route ✅ Verified

**How preserved:**
All existing API routes carry `requireAuth(req)` from fix/batch1. The three new routes added by Stage 1 — `POST /api/room/[roomId]/start`, `GET /api/room/[roomId]/members`, `GET /api/room/[roomId]` — all call `requireAuth` as their first action before any DB access.

**Verification:** `grep -r "requireAuth" src/app/api/` returns a match in every route file. `grep -rL "requireAuth" src/app/api/` must return empty.

---

### INV-2 — No browser-side Supabase writes for options or votes ✅ Verified

**How preserved:**
`RoomSessionProvider` registers `.on()` read handlers only. It never calls `supabase.from(...).insert()` or `supabase.from(...).delete()`. `sendReady` calls `channel.track()` — this is Supabase Presence, not a DB write. All option and vote mutations continue through `POST /api/option/...` and `POST /api/vote`.

**Verification:** `grep -r "supabase.from" src/app/` returns no results for `.insert()` or `.delete()` in any client-side file.

---

### INV-3 — Presence key bound before channel construction ✅ Verified

**How preserved:**
Auth gate `if (!userId || !token) return` runs before channel construction. `supabase.channel('room:${roomId}', { config: { presence: { key: userId } } })` — channel cannot be constructed without `userId`. `userId` is in `useEffect` deps.

**Verified in:** `RoomSessionProvider.tsx` — `supabase.channel(...)` is textually inside the branch after the `!userId` guard, and `userId` appears in the deps array `[roomId, userId]`.

---

### INV-4 — `channel.subscribe()` resolves to `SUBSCRIBED` before any write whose echo is expected ✅ Verified

**How preserved:**
All 8 `.on()` handlers registered before `.subscribe()`. `joinRoomAPI` POST (the self-INSERT into `room_members`) lives inside `subscribePromise.then(async () => { ... })` — structurally impossible to call before `SUBSCRIBED`.

**Verified in:** `RoomSessionProvider.tsx` — `fetch('/api/room/${roomId}', { method: 'POST' })` is the first element of `Promise.all(...)` inside the `.then()` block, textually after `subscribePromise` resolution.

---

### INV-5 — Subscription failure must abort all channels atomically ✅ Verified

**How preserved:**
Single-channel architecture. Failure calls `supabase.removeChannel(ch)` inside the subscribe callback before `reject()`. No other channels to orphan — invariant satisfied by construction, not convention.

**Verified in:** `RoomSessionProvider.tsx` subscribe callback: `} else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { supabase.removeChannel(ch); reject(...); }`. RC-4 cannot occur; no `Promise.allSettled` over multiple channel subscriptions.

---

### INV-6 — Session guard mirrors actual channel state ✅ Verified

**How preserved:**
`subscribedRoomIdRef` deleted. Guard is `useEffect([roomId, userId])` — React cleanup runs before the new effect, so no window where two channels are live. `setIsJoined(true)` only after `!aborted` and full bootstrap completion. `channelRef.current = null` is the first write in cleanup.

**Verified in:** `RoomSessionProvider.tsx` — no subscription-state `useRef` exists. Deps array is `[roomId, userId]`. `aborted = true` is the first line of the cleanup return function.

---

### INV-7 — `currentRoom.started_at` must be a server value ✅ Verified

**How preserved:**
`Room` interface changed: `started_at: string` → `startedAt: string | null`. `joinRoom` sets `startedAt: null`. `fetchRoom` (bootstrap + realtime UPDATE handler) sets `startedAt: r.started_at ?? null` from server response. `startRoom` is the sole documented optimistic exception, reconciled when the `room` UPDATE event fires `fetchRoom`.

**Verified in:** `useRoomStore.ts` — `joinRoom` sets `startedAt: null`. `startRoom` sets `startedAt: new Date().toISOString()`. `RoomSessionProvider.tsx` `fetchRoom` sets `startedAt: r.started_at ?? null`. No other `startedAt` write exists.

---

### INV-8 — Store teardown must be total before a new room session begins ✅ Verified

**How preserved:**
Effect cleanup synchronously calls `clearMembers`, `setOptions([])`, `clearVotes` (clears both `votesMap` and `voteResults`), `clearReady`, `exitRoom` before returning. React runs this cleanup before the new effect fires on dep change.

**Verified in:** `RoomSessionProvider.tsx` cleanup return function — all five store clears present in sequence. `clearVotes` updated to clear both `votesMap` and `voteResults` atomically (`useVoteStore.ts`). `RoomGuard` holds skeleton until `isJoined=true`, so stale localStorage `currentRoom` is never rendered.

---

## 2. Remaining Architectural Risks

### RISK-1 — No reconnect recovery ✅ Stage 2

Resolved in `fix/batch1-realtime-subscription-errors` Stage 2. The subscribe callback now distinguishes the initial `SUBSCRIBED` from subsequent ones via `firstSubscribe` flag. On reconnect, `reconnectBootstrap()` re-fetches all slices (room, members, options, votes) without calling `joinRoomAPI`, then re-tracks presence. `hasJoined` gate prevents double-bootstrap before the initial bootstrap completes.

---

### RISK-2 — Debounce timer outlives effect cleanup ✅ Stage 2

Resolved in Stage 2. `makeDebounce` now returns `T & { cancel: () => void }`. Effect cleanup calls `debouncedFetchVotes.cancel()` before `supabase.removeChannel(ch)`, dropping any pending timer before the version counter can be incremented by the orphaned closure.

---

### RISK-3 — `fetchRoom` is not versioned ✅ Resolved

`fetchRoom` already uses the module-level `roomVer` counter with the identical double-check pattern as `membersVer`, `optionsVer`, and `votesVer`:

```typescript
let roomVer = 0;
async function fetchRoom(roomId, token) {
  const v = ++roomVer;
  const res = await fetch(...);
  if (!res.ok || roomVer !== v) return;   // stale? abort before parse
  const { room: r } = await res.json();
  if (roomVer !== v) return;              // stale? abort before write
  useRoom.getState().setCurrentRoom({...});
}
```

Two concurrent `room` UPDATE events increment `roomVer` to different values; only the latest call's response is written to the store. The VALIDATION.md entry was written before `fetchRoom` received the versioning pattern during Stage 1.

---

### RISK-4 — `startedAt` lobby navigation lost during reconnect ✅ Stage 2

Resolved as a consequence of RISK-1 fix. `reconnectBootstrap()` calls `fetchRoom(roomId, token)` which sets `currentRoom.startedAt` from the server. If the host started the room during the outage, the reconnect refetch delivers the non-null `startedAt`, triggering the lobby `useEffect` navigation guard on all reconnecting guests.

---

### RISK-5 — `Promise.all` bootstrap fails on any single-call error (design tradeoff, documented in §3)

Covered under Accepted Tradeoffs below.

---

### RISK-6 — Presence convergence window after `channel.track()` ✅ Resolved

Resolved in `vote/page.tsx`. The all-ready check now uses `members` from `useRoomMemberStore` (DB-backed, set by `fetchMembersAPI` during bootstrap) as the denominator instead of `totalMembers` (presence-derived, subject to ~300ms convergence lag):

```typescript
if (members.length >= 2 && members.every((id) => readyMembers.includes(id))) {
```

**Why this closes RISK-6:** The original `totalMembers >= 2 && readyMembers.length === totalMembers` check had a gap: for N≥3-member rooms, if member C just joined and is in the 300ms convergence window, A's and B's clients see `totalMembers = 2` (C not propagated). If A and B both click Ready, `2 === 2` passes and they navigate to results before C has voted. The `>= 2` guard only protects 2-person rooms (where the sole new joiner being absent makes `totalMembers = 1`).

With the fix, C's `userId` is in `members` (written by `fetchMembers` at bootstrap, a DB call that completes long before presence converges). The `every` check sees that C is not in `readyMembers` and returns false — navigation blocked until C also readies.

**Residual (EC-1, unchanged):** The readiness display counter `{readyMembers.length} / {totalMembers}` still uses presence-derived values and lags ~300ms after a new member tracks. This is cosmetic and self-corrects; EC-1 remains documented and accepted.

---

## 3. Accepted Tradeoffs

### TRADEOFF-1 — All-or-nothing bootstrap (`Promise.all` over 5 calls)

`Promise.all([joinRoomAPI, fetchRoom, fetchMembers, fetchOptions, fetchVotes])` fails entirely if any one call fails. There is no partial-data rendering.

**Why accepted:** simpler error state — either the session is fully initialised or it is not. A partially-initialised session (e.g. members loaded but votes missing) is harder to reason about and to surface to the user. The error recovery path (refresh) is the same regardless of which call failed.

**Alternative considered:** `Promise.allSettled` with partial rendering. Rejected — adds complexity to the bootstrap render logic without solving the underlying failure.

---

### TRADEOFF-2 — No reconnect recovery ✅ Implemented in Stage 2

The provider now detects re-`SUBSCRIBED` (via `firstSubscribe` flag) and calls `reconnectBootstrap()` to re-fetch all slices without re-calling `joinRoomAPI`. Presence is re-tracked using `presenceRef.current` which holds the last-sent payload (preserving `isReady=true` if the user had already readied).

---

### TRADEOFF-3 — `votesMap` and `voteResults` temporarily inconsistent

`votesMap` is updated optimistically on own writes. `voteResults` is updated only by the debounced `fetchVotes` refetch. In the 50ms debounce window after a vote, `votesMap` reflects the new vote while `voteResults` does not.

**Why accepted:** immediate feedback in the vote list (via `votesMap`) without the old flicker problem (RC-2). `voteResults` is authoritative and self-corrects within 50ms + network RTT. The all-ready check and result page both use `voteResults`, so they are never triggered by the optimistic count.

---

### TRADEOFF-4 — 50ms debounce adds latency to `voteResults`

Every votes INSERT/DELETE event adds a 50ms delay before `fetchVotes` fires.

**Why accepted:** a burst of N concurrent votes produces one network call instead of N. At the vote-cast rates expected in this app (single-digit participants), this is unnoticeable. The tradeoff is favourable.

---

### TRADEOFF-5 — Stale `currentRoom` visible during ~200ms subscribe window

On mount, localStorage `currentRoom` from a previous session is technically in the store before Stage 4 overwrites it.

**Why accepted:** `RoomGuard` renders a loading skeleton while `isJoined=false`. The stale value is in Zustand state but is not rendered. It is overwritten before `isJoined` flips to `true`.

---

### TRADEOFF-6 — `Promise.allSettled` rule from `state-management.md` retired

The rule "use `Promise.allSettled` for realtime subscriptions" was written to guard the per-store subscribe-orchestrator code in `useRealtimeRoom.tsx`. That code is deleted. The single-channel architecture does not use `Promise.allSettled` for subscription — there is one channel and its failure is handled directly.

**Why accepted:** the rule was a workaround for a multi-channel failure mode that no longer exists. INV-5 is now enforced structurally rather than by convention.

---

## 4. Unresolved Assumptions

### ASSUMPTION-1 — Supabase Realtime delivers all events emitted after `SUBSCRIBED`

The architecture assumes that once the channel reaches `SUBSCRIBED`, every subsequent DB event matching the registered filters will be delivered. Supabase does not document a guarantee about events emitted during the handshake gap (between `.subscribe()` call and the `SUBSCRIBED` callback).

**Impact if false:** the self-INSERT echo from Stage 4 `joinRoomAPI` could be lost if it was emitted during the handshake gap — but the parallel `fetchMembersAPI` call covers this case regardless of whether the echo arrives. For subsequent events after bootstrap, a missed event means state is stale until the next event.

---

### ASSUMPTION-2 — `fetchMembersAPI` resolves before the self-INSERT echo arrives

The ordering guarantee for RC-1 relies on `fetchMembersAPI` [2] resolving before the self-INSERT echo travels DB → Realtime server → WebSocket → client. This is true "in the common case" but is not guaranteed on unusual network topologies.

**Impact if false:** `fetchMembersAPI` resolves without self, then the INSERT echo arrives and triggers a second `fetchMembers` via versionedFetch with a higher version — that call returns a snapshot including self. The result is correct. The assumption only affects which of the two `fetchMembers` calls first populates the store; correctness is preserved either way.

**This assumption is therefore safe to break** — versionedFetch handles the race regardless of which call wins.

---

### ASSUMPTION-3 — `POST /api/room/[roomId]` is safe to call on every mount for an existing member

`joinRoomAPI` is called unconditionally at Stage 4, including for users who are already members (e.g. page refresh without tab close). The server returns `alreadyMember: true` without inserting a duplicate row. The architecture assumes this is the correct and safe behaviour.

**Impact if false:** if the route inserts a duplicate row on re-join, the member list becomes polluted with duplicate `user_id` entries, and `fetchMembers` would return duplicates.

**Current server behaviour:** the route checks `room_members` for an existing row before inserting. Confirmed idempotent as of the last audit.

---

### ASSUMPTION-4 — RLS `room_members_select_v2` allows `fetchMembersAPI` before `joinRoomAPI` commits

In Stage 4, `joinRoomAPI` [0] and `fetchMembersAPI` [2] run in parallel. The RLS policy for `GET /api/room/[roomId]/members` requires the caller to be a member of the room. If `fetchMembersAPI` runs and the RLS check executes before the `joinRoomAPI` INSERT has committed, the server-side auth check may fail (caller is not yet a member).

**Impact if false:** `fetchMembersAPI` returns a 403 or empty result. `Promise.all` either rejects (TRADEOFF-1 applies, bootstrap fails) or returns an empty array.

**Mitigation:** the realtime INSERT echo triggers a second `fetchMembers` call after the commit is visible. If the initial call returns empty due to RLS timing, the echo-triggered call will return the correct list. This assumes `Promise.all` does not fail on a 403 from `fetchMembersAPI` — this depends on whether the implementation throws on non-200 responses or returns an empty array.

**This is unresolved.** The bootstrap error handling for this specific scenario requires verification.

---

### ASSUMPTION-5 — Debounce `cancel()` is called during effect cleanup ✅ Confirmed

`makeDebounce` returns `T & { cancel: () => void }` and cleanup calls `debouncedFetchVotes.cancel()`. RISK-2 is closed.

---

## 5. Known Eventual Consistency Limitations

### EC-1 — Presence state converges with ~300ms lag after track

`readyMembers`, `totalMembers`, and `memberNames` are derived from Supabase Presence via `syncPresence`. After `channel.track()` fires in Stage 4, the `sync` echo takes approximately 300ms to arrive. During this window, the calling client's own presence entry is absent from the store.

**Scope:** all clients see their own presence entry missing for ~300ms after joining or updating ready state. Supabase Presence is eventually consistent by design.

---

### EC-2 — Vote results lag `votesMap` by up to 50ms + network RTT

After any vote INSERT or DELETE, `voteResults` is updated only after the 50ms debounce fires and the `GET /api/vote/result` call resolves. During this window, `votesMap` reflects the new vote but `voteResults` does not. The delta is: `50ms debounce + network RTT` (typically 100–300ms total).

**Scope:** accepted tradeoff (TRADEOFF-3). The inconsistency window is bounded and predictable.

---

### EC-3 — Member list lags DB by one network RTT after join/leave

Every `room_members` INSERT or DELETE triggers `fetchMembers`, which fetches the authoritative list from the server. Between the DB write and the `setMembers` call completing, the member list shows the pre-event state.

**Scope:** this is the irreducible consistency lag of a refetch-on-event model. It cannot be reduced without moving to incremental patching (which reintroduces RC-1's dedup complexity).

---

### EC-4 — State is frozen for the duration of any WebSocket outage ✅ Resolved (Stage 2)

On reconnect, `reconnectBootstrap()` re-fetches all slices from the server, recovering any state that changed during the outage window. State is no longer permanently frozen after a reconnect.

**Residual:** events emitted during the outage that were not reflected in the server-side DB state at reconnect time are still missed. In practice this is not possible — all state changes are DB-mediated and the bootstrap fetches the authoritative DB snapshot.

---

### EC-5 — `startedAt` navigation is delivery-dependent for guests ✅ Resolved (Stage 2)

`reconnectBootstrap()` calls `fetchRoom()` which sets `currentRoom.startedAt` from the server. If the host started the room during the outage, the reconnect refetch delivers the non-null `startedAt`, triggering lobby navigation without a manual refresh.

---

### EC-6 — `alreadyMember` re-join does not fire a self-INSERT echo

When a returning user re-joins (e.g. after a page refresh), `joinRoomAPI` returns `alreadyMember: true` without inserting a new row. No `room_members` INSERT event fires on the channel. The initial `fetchMembersAPI` in the bootstrap covers self in this case. The echo-triggered second `fetchMembers` call (which normally confirms self after a fresh join) does not occur.

**Scope:** correctness is preserved — `fetchMembersAPI` covers self either way. The only difference is that a re-join does not produce a second `fetchMembers` call. This is benign.
