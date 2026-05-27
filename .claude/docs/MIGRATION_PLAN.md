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
Status: ⏳ Pending

Goals:
- snapshot refetch on reconnect
- state reconciliation
- stale fetch invalidation