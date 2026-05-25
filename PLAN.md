# Auth Architecture Fix Plan

Source: `/src/frontend.md` audit + re-audit (2026-05-24)

## All Issues Resolved

| # | What was broken | Fix applied | Risk avoided |
|---|---|---|---|
| ~~1~~ | `userId` read from request body in join route | `user.id` from JWT enforced server-side via `requireAuth` | Identity spoofing in `room_members` |
| ~~2~~ | `createOption/deleteOption/createVote/deleteVote` called Supabase directly from browser | Added `POST/DELETE /api/option/[roomId]` and `POST/DELETE /api/vote` routes | Auth perimeter had gaps — RLS was sole guard |
| ~~3~~ | `roomAPI.ts` called `getSession()` internally, diverging from Zustand token | Token now passed from `actionWrapper`/`getRequiredContext` | Stale-token 401s after session refresh |
| ~~4~~ | `AuthProvider` ran `getSession()` + `onAuthStateChange` in parallel | Removed `initializeAuth`; only `onAuthStateChange` remains | Race → `AuthGuard` sees `!loading && !user` → false redirect to login |
| ~~5~~ | Dead service files masked browser-side Supabase calls | `services/options.ts` and `services/votes.ts` deleted | Misleading naming, leaky auth perimeter |

**Also fixed:** Dead `userId` params removed from `createRoom`/`joinRoom` signatures and all call sites.

---

## Do Not Regress

- `requireAuth` pattern on all API routes
- Open redirect fix in `useAuth.ts:loginWithProvider` — URL origin validated
- `deleteOption`/`deleteVote` filter by `user_id = user.id` server-side
- `Promise.allSettled` for realtime subscriptions

---

# Zustand Store Design — Issue Backlog

Source: `/src/frontend.md` audit + scrutiny (2026-05-25)

## Priority Summary

| Priority | Issue | Effort | Risk |
|---|---|---|---|
| P0 | 3 stores never reject + caller never inspects `allSettled` results | Low-Medium (two coordinated changes) | High — silent subscription failure in production |
| P1 | Channel objects in Zustand state | Medium — `sendReady` + all `unsubscribe` access points | Medium — DevTools noise, memory leak on reset |
| P1 | `useRoomStore` God orchestrator | Medium (move cleanup to hook) | Medium — testability blocked |
| P2 | Untyped `useUiStore` string keys | Low (add union type) | Low — compile-time safety |
| P2 | `actionWrapper` rigid context | Low (add second wrapper) | Low — future extensibility |
| P3 | Post-track presence polling swallows failures silently | Low (fix error propagation, keep polling) | Low — edge case UX degradation |
| P3 | Form state in global Zustand | Low | Minimal |
| P3 | O(n) duplicate checks in option/vote stores | Low | Minimal at current scale |

---

## P0 — Subscribe Promises Never Reject + Caller Never Inspects Results

**Scope:** Three postgres_changes stores only:
- `store/room/useRoomRealtimeStore.ts`
- `store/option/useOptionRealtimeStore.ts`
- `store/vote/useVoteRealtimeStore.ts`

> `store/room/useRoomRealtimeReadyStore.ts` already rejects on `CHANNEL_ERROR` (line 91) and `TIMED_OUT` (line 96). Do not change it.

**Two-part failure:**

**Part A — stores never reject.** Each returns `new Promise` with only one path: `if (status === 'SUBSCRIBED') resolve()`. On `CHANNEL_ERROR` or `TIMED_OUT`, the promise hangs forever. The channel is dead; the caller gets no signal.

**Part B — caller never inspects settled results.** `useRealtimeRoom.tsx:36–43` calls `Promise.allSettled([...])` then unconditionally sets `subscribedRoomIdRef.current = roomId`. `Promise.allSettled` never throws. The `try/catch` around it (line 44) is dead code. Part A alone is useless — rejections swallowed by `allSettled` have no effect.

**Fix (both steps must ship together):**

Step 1 — add rejection paths to the three stores:
```typescript
.subscribe((status) => {
  if (status === 'SUBSCRIBED') resolve();
  else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
    supabase.removeChannel(channel);
    reject(new Error(`Realtime subscription failed: ${status}`));
  }
});
```

Step 2 — inspect results in `hooks/useRealtimeRoom.tsx`:
```typescript
const results = await Promise.allSettled([
  subscribeRoom(roomId),
  subscribeOption(roomId),
  subscribeVote(roomId),
  subscribeReady(roomId, user.id),
]);
const failures = results.filter(r => r.status === 'rejected');
if (failures.length > 0) {
  // surface to UI via useUiStore
  subscribedRoomIdRef.current = undefined;
  return;
}
subscribedRoomIdRef.current = roomId;
```

---

## P1 — Channel Objects in Zustand State

**Files:** All four realtime stores.

**Why dangerous:**
`RealtimeChannel` is a stateful WebSocket handle — not serializable. Stored in Zustand means DevTools shows garbage, orphaned channels leak on store reset, and persistence middleware would try to JSON-serialize a live socket.

**Migration is non-trivial:** Channels are *read* back from state, not just written:
- All four `unsubscribe()` read `get().channel` to call `supabase.removeChannel`.
- `useRoomRealtimeReadyStore.sendReady` reads `get().channel`, checks `channel.state`, calls `channel.track()`.

**Fix:** Move channel handles to a module-level `Map<roomId, RealtimeChannel>` outside the store. Zustand holds `subscribed: boolean` only. `sendReady` and `unsubscribe` look up the handle by `roomId` key. Do this as one coordinated PR.

---

## P1 — `useRoomStore` God Orchestrator

**File:** `store/room/useRoomStore.ts`

**Why dangerous:** `exitRoom()` reaches into 8 external stores (4 realtime + 4 data stores) via `.getState()`. Testing `useRoomStore` in isolation requires mocking 8 modules. Optional-chaining on `clearVotes?.()`, `clearReady?.()`, `clearMembers?.()` (lines 178–180) signals uncertain API contracts; `setOptions([])` on the same store does not use optional chaining — inconsistent.

**Fix:** Move the cleanup sequence to `hooks/useRoomLifeCycle.tsx` (already owns subscribe/unsubscribe). Each store's action clears only its own slice. The hook owns the sequence.

---

## P2 — Untyped String Keys in `useUiStore`

**File:** `store/useUiStore.ts`

**Why dangerous:** `setLoading("joinRoomLoading", true)` uses arbitrary strings. A typo silently creates a new key — the real flag never clears, the UI spins forever.

**Fix:** Add a `UiKey` union type over all valid key strings. Callers become type-checked; typos become compile errors.

---

## P2 — `actionWrapper` Rigid Context

**File:** `utils/actionWrapper.ts`

**Why dangerous (architectural, not current production bug):** `getRequiredContext()` always requires `userId + roomId + token`. All current callers are room-scoped, so this works. Future non-room actions (e.g. user settings) would have to bypass the wrapper, forking the pattern.

**Fix:** Split into `authActionWrapper` (token only) and `roomActionWrapper` (all three, current behaviour renamed). No callers change today.

---

## P3 — Post-Track Presence Polling Swallows Failures

**File:** `store/room/useRoomRealtimeReadyStore.ts:54–69`

**What it does:** Polls `ch.presenceState()` via recursive `setTimeout` (not `setInterval`) after `ch.track()` resolves, waiting for the user's own entry to appear in the distributed presence state. This is a legitimate workaround for Supabase Presence not reflecting `track()` synchronously.

**Where it's weak:** If polling exhausts MAX_RETRIES, the error is caught and `console.warn`'d, then `resolve()` is called unconditionally (line 90). Track failure is silently swallowed.

**Fix:** Keep the polling. Fix the error path — either propagate as rejection (hard fail) or surface via `useUiStore.setError` (soft fail with user-visible message).

---

## P3 — Form State in Global Zustand

**File:** `store/useRoomForm.ts` — Replace with `useState` in the room page component or React context scoped to `/room` layout. Eliminates one of the 13 stores.

## P3 — O(n) Duplicate Checks

**Files:** `store/option/useOptionStore.ts`, `store/vote/useVoteStore.ts` — `addOption`/`addVote` use `array.some()` on every realtime event. Replace internal `options: Option[]` with `Map<id, Option>` and expose an array selector. Defer until performance is a complaint.
