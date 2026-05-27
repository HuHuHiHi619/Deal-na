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

### RISK-1 — No reconnect recovery (medium severity) ⏳ Stage 2

When the WebSocket disconnects and Supabase auto-reconnects, the channel re-enters `SUBSCRIBED`. The provider does not detect this transition and does not re-run Stage 4 initial fetches.

**Consequence:** Any events emitted during the disconnection window are permanently lost. State is frozen at the last-known snapshot. It self-corrects only when the next event arrives and triggers a versionedFetch call. For a 30-second outage on an active room, member count, vote counts, and ready state can all be stale.

**Scope:** Not fixed in the restructure. Accepted for the initial implementation.

**Future fix shape:** Listen for `SUBSCRIBED` status in the subscribe callback after the initial subscription resolves; on subsequent `SUBSCRIBED` events, re-run the initial fetches from Stage 4.

---

### RISK-2 — Debounce timer outlives effect cleanup (low severity, subtle) ⚠️ Open

`debouncedFetchVotes` is constructed inside the `useEffect` closure with `debounce(() => fetchVotes(roomId), 50)`. When cleanup fires (`aborted = true`), the debounce timer may still be pending in the JavaScript task queue.

When the timer fires after cleanup:
1. It calls `fetchVotes(roomId)` where `roomId` is the old room.
2. `fetchVotes` is a module-level versionedFetch. It increments the module-level `version` counter.
3. The new session's initial `fetchVotes` call (in the new effect's Stage 4) had its own `myVersion = N`. The orphaned timer fires with `myVersion = N+1`.
4. If the orphaned timer's network call resolves, it passes the version check (`N+1 === N+1`) and writes old-room vote data into the new session's `voteResults`.

**Consequence:** new room session transiently shows vote data from the previous room until the next event triggers a fresh `fetchVotes`.

**Mitigation shape:** cancel the debounce in cleanup (`debouncedFetchVotes.cancel()`), or move debounce construction to module level and cancel it in the cleanup return.

---

### RISK-3 — `fetchRoom` is not versioned (low severity) ⚠️ Open

`fetchRoom` is called from the provider's `room` UPDATE event handler. It is not wrapped in a versionedFetch. If two `room` UPDATE events fire in rapid succession (e.g. a host double-triggers start), two `fetchRoom` calls are in-flight simultaneously. The last to resolve wins — which may be the older snapshot.

**Consequence:** `currentRoom.startedAt` may briefly show the older value before the newer fetch resolves. In practice this is low risk because `room` UPDATE events are rare (only one expected per session for the start trigger).

**Fix shape:** wrap `fetchRoom` in a versionedFetch instance at the provider level.

---

### RISK-4 — `startedAt` lobby navigation lost during reconnect (medium severity) ⏳ Stage 2

If a guest is disconnected at the moment the host triggers start, the `room` UPDATE event is delivered during the outage window and is permanently lost (RISK-1 applied to the start flow).

**Consequence:** the guest remains on the lobby page with `startedAt=null`. They will not automatically navigate to the vote page. Manual refresh is required.

**Scope:** a consequence of RISK-1. Resolved only when reconnect recovery is implemented.

---

### RISK-5 — `Promise.all` bootstrap fails on any single-call error (design tradeoff, documented in §3)

Covered under Accepted Tradeoffs below.

---

### RISK-6 — Presence convergence window after `channel.track()` (low severity, known)

After `channel.track({ isReady: false })` at the end of Stage 4, the `sync` event echo takes ~300ms. During this window, `totalMembers` does not include self and `readyMembers` is also incomplete.

**Consequence:** if another client calls `sendReady` in this window, `readyMembers.length === totalMembers` may pass prematurely (e.g. 1 ready, 1 total instead of 1 ready, 2 total). This would navigate the room to the result page before everyone has had a chance to vote.

**Mitigation:** the ~300ms window is small. The risk is highest for exactly 2-person rooms where both users join and one immediately clicks Ready. No guard is implemented in the current spec.

---

## 3. Accepted Tradeoffs

### TRADEOFF-1 — All-or-nothing bootstrap (`Promise.all` over 5 calls)

`Promise.all([joinRoomAPI, fetchRoom, fetchMembers, fetchOptions, fetchVotes])` fails entirely if any one call fails. There is no partial-data rendering.

**Why accepted:** simpler error state — either the session is fully initialised or it is not. A partially-initialised session (e.g. members loaded but votes missing) is harder to reason about and to surface to the user. The error recovery path (refresh) is the same regardless of which call failed.

**Alternative considered:** `Promise.allSettled` with partial rendering. Rejected — adds complexity to the bootstrap render logic without solving the underlying failure.

---

### TRADEOFF-2 — No reconnect recovery

The provider does not re-run Stage 4 fetches after a WebSocket reconnect. State is frozen during outages.

**Why accepted:** reconnect recovery requires detecting the re-`SUBSCRIBED` status (distinguishing the initial `SUBSCRIBED` from a subsequent one), and re-running all five initial fetches without re-calling `joinRoomAPI`. This is non-trivial and is not required to fix the three concrete bugs targeted by the restructure (RC-1, RC-2/3, RC-5).

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

### ASSUMPTION-5 — Debounce `cancel()` is called during effect cleanup

RISK-2 identifies that the debounce timer can outlive effect cleanup and write stale data. The resolution requires calling `debouncedFetchVotes.cancel()` in the cleanup function. This is listed as a known risk and a future fix but is **not confirmed to be in the implementation spec**. It is assumed that `debouncedFetchVotes` is either cancelled in cleanup or constructed at module level — this has not been finalised.

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

### EC-4 — State is frozen for the duration of any WebSocket outage

During a network interruption, the Supabase WebSocket is disconnected. No events are received. All slice stores remain at their last-known state. Supabase auto-reconnects, but the provider does not re-run initial fetches on reconnect (RISK-1).

**Scope:** state self-corrects after the next event arrives post-reconnect. For a room where no further events are emitted (e.g. all votes are already cast), state may remain stale for the remainder of the session without a refresh.

---

### EC-5 — `startedAt` navigation is delivery-dependent for guests

Guests navigate from lobby to the vote page when `currentRoom?.startedAt` becomes non-null. This change arrives via the `room` UPDATE realtime event → `fetchRoom` → `setCurrentRoom`. If the event is missed (outage, EC-4), the guest is not navigated and must refresh.

**Scope:** a direct consequence of EC-4 applied to the start trigger. No guard exists in the current spec.

---

### EC-6 — `alreadyMember` re-join does not fire a self-INSERT echo

When a returning user re-joins (e.g. after a page refresh), `joinRoomAPI` returns `alreadyMember: true` without inserting a new row. No `room_members` INSERT event fires on the channel. The initial `fetchMembersAPI` in the bootstrap covers self in this case. The echo-triggered second `fetchMembers` call (which normally confirms self after a fresh join) does not occur.

**Scope:** correctness is preserved — `fetchMembersAPI` covers self either way. The only difference is that a re-join does not produce a second `fetchMembers` call. This is benign.
