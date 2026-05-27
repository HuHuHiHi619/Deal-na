# Realtime Migration Plan

## Stage 1 — Ownership Consolidation
Status: ✅ Completed — `fix/batch1-realtime-subscription-errors` → `RoomSessionProvider` ships single-channel bootstrap, versionedFetch, `aborted` teardown, and context-based `sendReady`; INV-3/4/5/6/7/8 all structurally enforced.

Protected:
- INV-3 — presence key bound at channel construction
- INV-4 — all 8 handlers registered before `.subscribe()`; bootstrap runs inside `.then()` of resolved subscribePromise
- INV-5 — single channel; failure calls `removeChannel` before reject; no orphan possible
- INV-6 — `[roomId, userId]` effect dep guard replaces `subscribedRoomIdRef`; React cleanup runs before new effect
- INV-7 — `Room.startedAt: string | null`; only `fetchRoom` writes it; `startRoom` optimistic is the sole documented exception
- INV-8 — effect cleanup synchronously clears all 5 slices before new effect fires

Delivered:
- `RoomSessionProvider` in `[roomId]/layout.tsx` — single channel owner, singleton per route subtree
- `GET /api/room/[roomId]` — full room snapshot for bootstrap
- `GET /api/room/[roomId]/members` — member list for bootstrap
- `POST /api/room/[roomId]/start` — host start trigger
- Vote result API extended to return raw votes for `votesMap` bootstrap
- `setCurrentRoom`, `setMembers`, `setVoteResults` setters added to stores
- `ReadyButton` reads `sendReady` from `useRoomSession()` context
- 4 separate channels → 1 channel; duplicate subscription risk eliminated

Remaining:
- reconnect recovery (RISK-1)
- debounce cancel in cleanup (RISK-2)
- `fetchRoom` versioning (RISK-3)

---

## Stage 2 — Reconnect Recovery
Status: ✅ Completed — `fix/batch1-realtime-subscription-errors` → `RoomSessionProvider` ships `firstSubscribe` flag, `reconnectBootstrap`, `hasJoined` gate, `presenceRef` replay, `reconnecting` guard, and `debouncedFetchVotes.cancel()` in cleanup; RISK-1/2/3/4 all resolved.

Goals:
- snapshot refetch on reconnect
- state reconciliation
- stale fetch invalidation

Delivered:
- `firstSubscribe` flag distinguishes initial SUBSCRIBED from WebSocket reconnect
- `reconnectBootstrap()` re-fetches room/members/options/votes without re-calling `joinRoomAPI`
- `hasJoined` gate prevents reconnect bootstrap from racing with initial bootstrap
- `presenceRef` stores last-sent track payload; replayed after reconnect to restore ready state
- `reconnecting` flag prevents concurrent reconnect bootstraps on flapping connections
- `debouncedFetchVotes.cancel()` in cleanup drops any pending timer before version counter can be incremented by orphaned closure (RISK-2)
- `roomVer` counter added to `fetchRoom` — same double-check pattern as other versioned fetches (RISK-3)

---

## Stage 3 — Authoritative Refetch Model
Status: ✅ Completed — `fix/batch1-realtime-subscription-errors` → all direct-patch realtime stores deleted; post-write `fetchVote()` calls removed from `createVote`/`deleteVote`; events are now pure invalidation signals.

Goals:
- events become invalidation signals instead of direct truth patches
- versionedFetch protection on all slice writes
- stale response cancellation/ignore
- remove unsafe direct state patches

Deleted:
- `store/room/useRoomRealtimeStore.ts` — called `addMember(payload.new.user_id)` on INSERT
- `store/option/useOptionRealtimeStore.ts` — called `addOption`/`removeOption` on events
- `store/vote/useVoteRealtimeStore.ts` — called `addVote`/`deleteVote` on events
- `store/room/useRoomRealtimeReadyStore.ts` — polling-based presence with direct store writes
- `hooks/useRealtimeRoom.tsx` — orchestrated the 4 old stores; never called by any page
- `hooks/useRoomLifeCycle.tsx` — called subscribeAll/unsubscribeAll; never called by any page
- `lib/voteAPI.ts` — only consumed by the now-removed `fetchVote`
- `api/__tests__/subscribFailure.test.ts` — tested the deleted stores

Fixed:
- `useVoteStore.createVote` — removed `await get().fetchVote()` after optimistic `addVote`; debounced realtime INSERT event is the sole reconciliation path (closes RC-2, RC-3)
- `useVoteStore.deleteVote` — same removal after optimistic `removeVote`
- `useVoteStore.fetchVote` — method removed entirely (forbidden post-write fetch pattern)
- `result/page.tsx` — removed `fetchVote()` on mount; `voteResults` populated by provider bootstrap
- `useExitRoom.tsx` — removed `unsubscribeAll` call; provider cleanup owns channel teardown on navigation
- `useUiStore.ts` — removed `fetchVoteLoading` from `UiKey` type

Validation:
- Duplicate events cannot corrupt state: all event handlers call versionedFetch → full-replace setter; no incremental patch path remains
- Stale fetches cannot overwrite newer state: module-level version counters drop any response that is not the latest call

---

## Stage 4 — Reconciliation Safety
Status: ✅ Completed — `fix/batch1-realtime-subscription-errors` (2026-05-27)

Goals:
- eliminate all patch-mode write paths forbidden by STATE_OWNERSHIP_MATRIX
- verify versionedFetch correctness and stale-drop guarantees
- verify idempotent reducer property holds for all slice setters
- verify optimistic revert analysis

Deleted (forbidden write paths):
- `useRoomMemberStore.addMember` / `removeMember` — patch-mode methods; only `setMembers` via versionedFetch is permitted
- `useRoomReadyStore.addReady` — patch-mode method; only `syncPresence` writes `readyMembers`
- `useOptionStore.fetchOption` / `addOption` / `removeOption` — unversioned fetch + patch methods; `fetchOptions` in provider is the sole write path
- `useRoomStore.joinRoom` — dead code; `RoomSessionProvider` owns join via direct `fetch` inside bootstrap; `isJoin`/`hasExit` flags removed with it
- `joinRoomAPI` export removed from `lib/roomAPI.ts`
- Dead `UiKey` entries `joinRoomLoading`, `fetchOptionsLoading`, `createOptionLoading` removed from `useUiStore.ts`

Verified:
- All 4 versionedFetch functions have module-level counters with pre-parse + pre-write stale checks
- Idempotent setters: full-replace on every slice; Map dedup on `addVote`
- Optimistic revert window is bounded and self-correcting (TRADEOFF-3)