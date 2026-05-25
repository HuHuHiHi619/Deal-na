> **Pattern:** When a new issue is spotted, add it here using the same format below —
> Priority heading → Status → Affected files → What's broken → Fix spec → Verify.

# State Management Issues

Source: Zustand store audit (2026-05-25). **P0+P1+P2 resolved 2026-05-25**. 3 issues remain (all P3): Presence polling swallows failures, Form state in global Zustand, O(n) duplicate checks.

---

## P0 — Subscribe Promises Never Reject + allSettled Not Inspected

**Status:** [x] resolved — `fix/batch1-realtime-subscription-errors` (2026-05-25)

**Affected files:**
- `store/room/useRoomRealtimeStore.ts` — `.subscribe()` callback, only resolves on `SUBSCRIBED`
- `store/option/useOptionRealtimeStore.ts` — same pattern
- `store/vote/useVoteRealtimeStore.ts` — same pattern
- `hooks/useRealtimeRoom.tsx:36–46` — `Promise.allSettled` result never inspected; `subscribedRoomIdRef` set unconditionally

> **Do NOT touch:** `store/room/useRoomRealtimeReadyStore.ts` already rejects on `CHANNEL_ERROR` and `TIMED_OUT` — this is the reference implementation.

**What's broken:**

Two-part failure. Part A: the three postgres_changes stores return `new Promise` with only one path — `if (status === 'SUBSCRIBED') resolve()`. On `CHANNEL_ERROR` or `TIMED_OUT` the promise hangs forever. Part B: `useRealtimeRoom.tsx` calls `Promise.allSettled([...])` and then unconditionally sets `subscribedRoomIdRef.current = roomId`. `allSettled` never throws, so the `try/catch` around it is dead code. Part A alone is useless — rejections swallowed by `allSettled` have no effect.

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

**Verify:** Simulate `CHANNEL_ERROR` by revoking Supabase anon key mid-session — UI should show an error instead of silently stalling.

---

## P1 — Channel Objects Stored in Zustand State

**Status:** [x] resolved — already in `fix/batch1-realtime-subscription-errors` (all four stores use module-level `activeChannel` var; Zustand holds `subscribed: boolean` only)

**Affected files:**
- `store/room/useRoomRealtimeStore.ts` — `set({ channel })`
- `store/option/useOptionRealtimeStore.ts` — `set({ channel })`
- `store/vote/useVoteRealtimeStore.ts` — `set({ channel })`
- `store/room/useRoomRealtimeReadyStore.ts` — `set({ channel: ch })`; `sendReady` reads `get().channel` and checks `channel.state`

**What's broken:**

`RealtimeChannel` is a stateful WebSocket handle — not serializable. Stored in Zustand means DevTools shows garbage, orphaned channels leak on store reset, and persistence middleware would try to JSON-serialize a live socket.

**Fix:**

Move channel handles to a module-level `Map<roomId, RealtimeChannel>` outside each store. Zustand holds `subscribed: boolean` only. `sendReady` and all `unsubscribe` methods look up the handle by `roomId` key. Ship as one coordinated PR.

**Verify:** Open Zustand DevTools — no `RealtimeChannel` objects should appear in any store slice.

---

## P1 — useRoomStore God Orchestrator

**Status:** [x] resolved — already in `fix/batch1-realtime-subscription-errors` (`exitRoom` only clears its own slice; cleanup sequence lives in `useRoomLifeCycle.tsx`)

**Affected files:**
- `store/room/useRoomStore.ts:162–182` — `exitRoom()` reaches into 8 external stores

**What's broken:**

`exitRoom()` calls `.getState()` on 8 modules: 4 realtime stores (unsubscribe) + 4 data stores (clear). Testing `useRoomStore` in isolation requires mocking 8 modules. Optional-chaining inconsistency: lines 178–180 use `clearVotes?.()`, `clearReady?.()`, `clearMembers?.()` but line 181 calls `setOptions([])` without `?.` — signals uncertain API contracts.

**Fix:**

Move the cleanup sequence to `hooks/useRoomLifeCycle.tsx` (already owns subscribe/unsubscribe). Each store's action clears only its own slice. The hook owns the sequence.

**Verify:** `useRoomStore` unit tests require zero external store mocks after the change.

---

## P2 — Untyped String Keys in useUiStore

**Status:** [x] resolved — `fix/batch2-p2-typed-uikey-actionwrapper` (2026-05-25); `UiKey` union type exported from `useUiStore.ts`, all setter/getter signatures updated; `useAsyncAction.tsx` and `actionHelper.ts` typed accordingly

**Affected files:**
- `store/useUiStore.ts` — `setLoading(key: string, value: boolean)`

**What's broken:**

`setLoading("joinRoomLoading", true)` accepts any string. A typo silently creates a new key — the real flag never clears and the UI spins forever. Current call sites include `"joinRoomLoading"`, `"fetchOptionsLoading"`, `"createOptionLoading"`, `"deleteOptionLoading"`, `"createVoteLoading"`, `"deleteVoteLoading"`.

**Fix:**

Add a `UiKey` union type over all valid key strings. Callers become type-checked; typos become compile errors.

```typescript
type UiKey =
  | 'joinRoomLoading'
  | 'fetchOptionsLoading'
  | 'createOptionLoading'
  | 'deleteOptionLoading'
  | 'createVoteLoading'
  | 'deleteVoteLoading';

setLoading: (key: UiKey, value: boolean) => ...
```

**Verify:** Introduce a deliberate typo in a call site — TypeScript should error at compile time.

---

## P2 — actionWrapper Rigid Context

**Status:** [x] resolved — `fix/batch2-p2-typed-uikey-actionwrapper` (2026-05-25); split into `roomActionWrapper` (room context) + `authActionWrapper` (token only); `actionWrapper` re-exported as alias so all callers unchanged; `getRequiredAuth()` added to `utils/context.ts`

**Affected files:**
- `utils/actionWrapper.ts` — `actionWrapper` always invokes `getRequiredContext()`
- `utils/context.ts` — `getRequiredContext()` requires `userId + roomId + token`; throws if `roomId` missing

**What's broken:**

All current callers are room-scoped so this works today, but any future non-room action (e.g. user profile update) would have to bypass the wrapper entirely, forking the pattern.

**Fix:**

Split into two wrappers — no callers change today:
- `authActionWrapper(key, { action, onSuccess, onError })` — provides `{ token }` only
- `roomActionWrapper(key, { action, onSuccess, onError })` — provides `{ userId, roomId, token }` (current behavior, renamed)

**Verify:** TypeScript compiles without changes to existing call sites.

---

## P3 — Presence Polling Swallows Failures

**Status:** [ ] open

**Affected files:**
- `store/room/useRoomRealtimeReadyStore.ts:54–102` — polling catch block warns then calls `resolve()` unconditionally

**What's broken:**

After `ch.track()` resolves, a recursive `setTimeout` polls `ch.presenceState()` waiting for the user's own entry to appear (legitimate Supabase Presence workaround). If polling exhausts `MAX_RETRIES`, the error is caught and `console.warn`'d — then `resolve()` is called unconditionally at line 90. Track failure is silently swallowed.

**Fix:**

Keep the polling. Fix the error path — either:
- Hard fail: propagate as rejection so the P0 caller can surface it to the UI
- Soft fail: call `useUiStore.getState().setError('readyTrackError', message)` before resolving

**Verify:** Force `MAX_RETRIES` to 1 in a test — confirm the failure surfaces (error in UI or rejected promise) rather than silently continuing.

---

## P3 — Form State in Global Zustand

**Status:** [ ] open

**Affected files:**
- `store/useRoomForm.ts` — `titleInput`, `optionsInput` stored globally

**What's broken:**

Form inputs for room creation live in a global Zustand store. They survive navigation and need explicit resets. This is one of the 13 stores and owns the least-shared state in the app.

**Fix:**

Replace with `useState` in the room page component or React context scoped to the `/room` layout. Eliminates one Zustand store.

**Verify:** Room form resets naturally on unmount without explicit `reset()` calls.

---

## P3 — O(n) Duplicate Checks

**Status:** [ ] open

**Affected files:**
- `store/option/useOptionStore.ts:33–37` — `addOption` uses `array.some((opt) => opt.id === option.id)`
- `store/vote/useVoteStore.ts:39–44` — `addVote` uses `array.some((v) => v.id === vote.id)`

**What's broken:**

Every realtime event triggers an O(n) scan. Not a current performance problem at this scale, but the pattern accumulates cost as option/vote counts grow.

**Fix (defer until performance is a complaint):**

Replace internal `options: Option[]` / `votes: Vote[]` with `Map<id, Option>` / `Map<id, Vote>`. Expose an array selector derived from `Array.from(map.values())`.

**Verify:** Duplicate realtime events do not create duplicates in rendered lists; `map.has(id)` replaces `array.some`.

---

## Do Not Regress

These fixes have already shipped — do not undo them:

- `requireAuth` pattern on all API routes (`src/app/api/`)
- Open redirect fix in `useAuth.ts:loginWithProvider` — URL origin validated before redirect
- `deleteOption`/`deleteVote` filter by `user_id = user.id` server-side (not client-enforced)
- `Promise.allSettled` for realtime subscriptions — do NOT replace with `Promise.all`
- Dead service files `services/options.ts` and `services/votes.ts` deleted — do not recreate browser-side Supabase calls for option/vote writes
