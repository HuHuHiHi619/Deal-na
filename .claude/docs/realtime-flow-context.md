# Realtime Flow Context

Last updated: 2026-05-27 — reflects state after `fix/batch1-realtime-subscription-errors` audit.

---

## Architecture Overview

Four parallel Supabase Realtime subscriptions are managed by `useRealtimeRoom` and coordinated by `useRoomLifecycle`. Three channels use postgres_changes (DB-event driven); one uses Presence (ephemeral connection-state driven).

```
useRoomLifecycle
  └── useRealtimeRoom
        ├── useRoomRealtimeStore       → postgres_changes: room_members INSERT
        ├── useOptionRealtimeStore     → postgres_changes: options INSERT + DELETE
        ├── useVoteRealtimeStore       → postgres_changes: votes INSERT + DELETE
        └── useRoomRealtimeReadyStore  → Presence: sync / join / leave
```

---

## Channel Responsibilities

### `useRoomRealtimeStore`
- **Channel:** `room:{roomId}`
- **Events:** `room_members` INSERT only
- **Effect:** calls `useRoomMemberStore.addMember(payload.new.user_id)`
- **Semantics:** append-only — records who has *ever* joined. No DELETE handler; `room_members` rows are never deleted during normal user flow. Member list only clears on `exitRoom` (local store reset).

### `useOptionRealtimeStore`
- **Channel:** `options:{roomId}`
- **Events:** `options` INSERT → `addOption(payload.new)` ; DELETE → `removeOption(payload.old.id)`

### `useVoteRealtimeStore`
- **Channel:** `votes:{roomId}`
- **Events:** `votes` INSERT → `addVote(payload.new)` ; DELETE → `deleteVote(payload.old.id, payload.old.option_id)`

### `useRoomRealtimeReadyStore`
- **Channel:** `room-ready-{roomId}` (Presence, key = `userId`)
- **On subscribe:** tracks `{ userId, name, isReady: false, joinedAt }` into presence; polls `ch.presenceState()` up to 30 × 100 ms to confirm own entry appears before resolving
- **Presence sync:** rebuilds `useRoomReadyStore` state — `totalMembers` (count of online keys), `readyMembers` (keys where `isReady === true`), `memberNames` (Map of userId → display name)
- **sendReady(userId, name):** tracks `{ isReady: true, readyAt }` — triggers sync on all subscribers
- **Semantics:** presence reflects *currently connected* users only. Differs from `useRoomMemberStore` which reflects *ever-joined* users.

> **Two member sources — intentional design:**
> - Waiting room "who is here now" → `useRoomReadyStore.totalMembers` / `memberNames` (presence)
> - Lock-vote page "who must vote" → `useRoomMemberStore.members` (DB, append-only)

---

## Shared Interface

```typescript
// useOptionRealtimeStore.ts
interface RealtimeStore {
  subscribed: boolean;
  subscribe: (roomId: string) => void;         // single-arg; only ready store needs userId/name
  unsubscribe: () => Promise<void>;
  sendReady?: (userId: string, name?: string) => Promise<boolean>;
}

// useRoomRealtimeReadyStore.ts
interface ReadyRealtimeStore extends RealtimeStore {
  subscribe: (roomId: string, userId?: string, name?: string) => void;
  sendReady: (userId: string, name?: string) => Promise<boolean>;  // non-optional
}
```

`useRoomRealtimeStore`, `useOptionRealtimeStore`, `useVoteRealtimeStore` implement `RealtimeStore`.
`useRoomRealtimeReadyStore` implements `ReadyRealtimeStore`.

---

## Subscribe Flow

```
useRoomLifecycle (join effect)
  joinRoom(roomId)
    .then(async () => {
      await subscribeAll()   ← useRealtimeRoom
        Promise.allSettled([
          subscribeRoom(roomId),
          subscribeOption(roomId),
          subscribeVote(roomId),
          subscribeReady(roomId, user.id, name),
        ])
        → any rejection → setError('subscriptionError', ...) + clear ref
        → all fulfilled    → subscribedRoomIdRef.current = roomId
      lifecycle.onRoomJoined?.()
    })
```

Each `subscribe()` returns `Promise<void>` that:
- **resolves** when Supabase status reaches `SUBSCRIBED`
- **rejects** on `CHANNEL_ERROR` or `TIMED_OUT` (calls `supabase.removeChannel` before rejecting)

Dedup guard in `subscribeAll`: if `subscribedRoomIdRef.current === roomId`, returns early (prevents double-subscription on re-render).

---

## Unsubscribe Flow

```
useRoomLifecycle (exit effect — fires when pathname leaves /room/)
  exitRoom()                          ← clears useRoomStore slice only
  clearVotes()                        ← stop rendering stale data immediately
  clearMembers()
  setOptions([])
  unsubscribeAll()                    ← fire-and-forget after stores are clean
    Promise.allSettled([
      unsubscribeRoom(),
      unsubscribeOption(),
      unsubscribeVote(),
      unsubscribeReady(),
    ])
    → subscribedRoomIdRef.current = undefined
```

Each `unsubscribe()` is `async`:
1. Nulls `activeChannel` *before* awaiting (re-entrancy safe)
2. `await supabase.removeChannel(ch)` — waits for Supabase acknowledgement
3. `set({ subscribed: false })`

`unsubscribeReady` additionally: `await ch.untrack()` before `removeChannel`, then calls `useRoomReadyStore.clearReady()`.

**Order rationale:** stores clear synchronously *before* `unsubscribeAll` so the UI never shows stale data while teardown is in progress. Any event arriving in the sub-millisecond window after store clear is harmless.

---

## Module-scope Channel Handles

All four stores keep the active channel in a module-level variable (`let activeChannel: RealtimeChannel | null = null`), not in Zustand state. Zustand holds `subscribed: boolean` only. This prevents DevTools serialization noise and orphaned channel leaks on store reset.

---

## Error Surfaces

| Failure | Where surfaced |
|---------|---------------|
| Subscribe `CHANNEL_ERROR` / `TIMED_OUT` | `useUiStore.setError('subscriptionError', ...)` via `useRealtimeRoom.subscribeAll` |
| Presence track timeout (30 retries exhausted) | Promise rejection → caught by `subscribeAll` → same `subscriptionError` |
| `untrack` failure on exit | `console.warn` only — non-fatal, teardown continues |
| `removeChannel` failure on exit | `console.warn` only — non-fatal |
