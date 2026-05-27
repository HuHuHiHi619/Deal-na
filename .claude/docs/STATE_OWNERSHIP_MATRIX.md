# STATE_OWNERSHIP_MATRIX.md — Zustand Ownership Model

> Single authoritative ownership model derived from TARGET_RUNTIME_FLOW.md.
> Every state domain has exactly one write path per operation type. All other write paths are forbidden.
> "Write path" = the function that calls the Zustand setter. Not the component. Not the hook.
> Last audited: 2026-05-27.

---

## Update Type Key

| Type | Meaning |
|---|---|
| **refetch** | Replace entire slice with a fresh server snapshot via versionedFetch. Safe against stale overwrites. |
| **optimistic** | Client-side write before server confirms. Must be reconciled by a subsequent refetch event. |
| **patch** | Incremental mutation of existing slice state. Requires dedup guard. Avoided in the target architecture. |
| **derived** | Computed from another live data source (WebSocket presenceState). No network call. |
| **clear** | Zero-out the slice. Only fires during effect cleanup. |

---

## Domain 1 — Room Metadata

**Store:** `useRoomStore` (`store/room/useRoomStore.ts`)
**Persisted:** yes — `zustand/persist`, localStorage key `room-storage`
**Fields:** `id`, `roomCode`, `title`, `status`, `createdAt`, `expiredAt`, `createdBy`, `startedAt`, `url`

### Authoritative Source

| Field | Source |
|---|---|
| `id`, `roomCode`, `title`, `status`, `createdAt`, `expiredAt`, `createdBy` | `POST /api/room/[roomId]` response — full row select |
| `startedAt` | `GET /api/room/[roomId]` — `null` until host writes via `POST /api/room/[roomId]/start` |
| `url` | Computed client-side: `` `/room/${id}` `` — not from server |

### Allowed Writers

| Writer | Function | Type | Trigger |
|---|---|---|---|
| `RoomSessionProvider` bootstrap | `useRoom.getState().setCurrentRoom(room)` | refetch | Stage 4 `fetchRoomAPI` resolves |
| `RoomSessionProvider` event handler | `fetchRoom(roomId)` → `setCurrentRoom` | refetch | `room` UPDATE realtime event |
| `useRoom.createRoom` | `set({ currentRoom: room })` | refetch | `POST /api/room/create` resolves |
| `useRoom.startRoom` | `set({ currentRoom: { ...cur, startedAt: now } })` | optimistic | host clicks Start |
| Effect cleanup | `useRoom.getState().exitRoom()` | clear | unmount or `[roomId, userId]` dep change |

### Update Strategy

- **Bootstrap and event-triggered writes:** full refetch — `fetchRoomAPI` → `setCurrentRoom`. All fields replaced atomically.
- **startRoom:** optimistic patch of `startedAt` only. No other field is mutated client-side.
- **createRoom:** full write from `POST /api/room/create` response.
- `joinRoom` does not write `currentRoom` in the target. That responsibility moved entirely to provider bootstrap.

### Reconciliation Strategy

- **startRoom optimistic:** the `room` UPDATE realtime event fires after the server write. `fetchRoom` is called, `setCurrentRoom` overwrites the optimistic value with the confirmed server timestamp.
- **Bootstrap vs. localStorage:** on mount, stale `currentRoom` from localStorage is visible during the ~200ms subscribe window. Provider holds `isJoined=false` until Stage 4 completes, so `RoomGuard` keeps the loading skeleton visible. The stale value is overwritten when `setCurrentRoom` fires at the end of Stage 4.
- No versionedFetch is applied to `fetchRoom` in the current spec — it is called only from a single code path at a time (bootstrap or event handler), so concurrent resolution is not a risk.

### Realtime Behavior

- Single event type: `postgres_changes` UPDATE on `room` table, filter `id=eq.${roomId}`.
- Handler: `() => fetchRoom(roomId)` — always a full refetch, never a field-level patch.
- Fires when host triggers start (the only expected UPDATE in normal flow).

### Stale-State Risks

| Risk | Condition | Guard |
|---|---|---|
| Stale `currentRoom` visible on mount | localStorage survives tab close; new session opens before bootstrap completes | `RoomGuard` holds loading state until `isJoined=true` |
| `startedAt` fabricated | `joinRoom` historically set `started_at: now+24h` | Forbidden in target; field must come from `fetchRoomAPI` verbatim |
| `startedAt` camelCase mismatch | Lobby reads `startedAt`, interface had `started_at` | Resolved by `Room` interface fix — all fields camelCase, mapped at API boundary in `roomAPI.ts` |

---

## Domain 2 — Member List

**Store:** `useRoomMemberStore` (`store/room/useRoomMemberStore.ts`)
**Persisted:** no
**Fields:** `members: string[]`

### Authoritative Source

`GET /api/room/[roomId]/members` — returns `string[]` of `user_id` for all current `room_members` rows. Gated by RLS policy `room_members_select_v2` (membership required).

### Allowed Writers

| Writer | Function | Type | Trigger |
|---|---|---|---|
| `RoomSessionProvider` bootstrap | `useRoomMemberStore.getState().setMembers(members)` | refetch | Stage 4 `fetchMembersAPI` resolves |
| `fetchMembers` versionedFetch | `useRoomMemberStore.getState().setMembers(data)` | refetch | `room_members` INSERT event |
| `fetchMembers` versionedFetch | `useRoomMemberStore.getState().setMembers(data)` | refetch | `room_members` DELETE event |
| Effect cleanup | `useRoomMemberStore.getState().clearMembers()` | clear | unmount or dep change |

### Update Strategy

Refetch-only. `setMembers` always replaces the entire array with the server snapshot. No incremental `addMember` or `removeMember` in the target architecture. Both INSERT and DELETE events call the same `fetchMembers` function — the response is always authoritative.

### Reconciliation Strategy

- **Self-INSERT echo:** `joinRoomAPI` [0] and `fetchMembersAPI` [2] run in parallel in Stage 4. `fetchMembersAPI` [2] typically resolves before the self-INSERT echo arrives over the WebSocket. When the echo arrives, it triggers a second `fetchMembers` call via versionedFetch with a higher version number — that call wins and writes a snapshot that includes self.
- **Concurrent INSERT + DELETE:** both trigger `fetchMembers`. versionedFetch orders them — the later call wins regardless of network resolution order.
- **Duplicate INSERT event:** triggers a second `fetchMembers`, which returns the same list. `setMembers` is idempotent on identical input. No dedup guard needed.

### Realtime Behavior

- Two event types on `room_members` table: INSERT and DELETE, both filtered by `room_id=eq.${roomId}`.
- Both handlers call `fetchMembers(roomId)` — identical handler, no branch on event type.
- No debounce. Member joins and departures are low-frequency; each gets its own fetch.

### Stale-State Risks

| Risk | Condition | Guard |
|---|---|---|
| Pre-existing members invisible | No initial fetch (current architecture) | Eliminated: `fetchMembersAPI` in Stage 4 bootstrap covers all existing members |
| Self missing from list | Self-INSERT echo missed because subscribe happened after POST (current architecture) | Eliminated: subscribe-before-join ordering in Stage 3/4 |
| Departure invisible | No DELETE handler (current architecture) | Eliminated: DELETE event triggers `fetchMembers` in target |
| Stale response overwrites current | Two concurrent fetches, older resolves later | versionedFetch: later call's version wins; older result is dropped |

---

## Domain 3a — Vote Entities

**Store:** `useVoteStore` (`store/vote/useVoteStore.ts`)
**Persisted:** no
**Fields:** `votesMap: Map<string, Vote>`

### Authoritative Source

`GET /api/vote/result?roomId=` — entity list from response body. Also the source for `voteResults` (Domain 3b).

### Allowed Writers

| Writer | Function | Type | Trigger |
|---|---|---|---|
| `RoomSessionProvider` bootstrap | `useVoteStore.getState().setVotes(votes)` | refetch | Stage 4 `fetchVotesAPI` resolves |
| `fetchVotes` versionedFetch | `useVoteStore.getState().setVotes(data.votes)` | refetch | votes INSERT/DELETE event (debounced 50ms) |
| `useVoteStore.createVote` | `get().addVote(newVote)` | optimistic | user casts vote, before server confirms |
| `useVoteStore.deleteVote` | `get().removeVote(voteId)` | optimistic | user retracts vote, before server confirms |
| Effect cleanup | `useVoteStore.getState().clearVotes()` | clear | unmount |

### Update Strategy

- **Optimistic:** `createVote` calls `addVote(newVote)` immediately. `deleteVote` calls `removeVote(voteId)` immediately. These are the only patch operations permitted.
- **Refetch:** the realtime INSERT/DELETE echo triggers `debouncedFetchVotes`, which calls `setVotes` — a full replacement that overwrites the optimistic entry.
- `addVote` uses Map dedup on `id` — no duplicate entry is created during the window between optimistic write and refetch confirmation.

### Reconciliation Strategy

- **Optimistic → refetch:** `createVote` writes optimistically. The realtime echo arrives ~50–200ms later, triggering `debouncedFetchVotes`. After the debounce window, `fetchVotes` fires and `setVotes` replaces the map with the server snapshot. The optimistic entry is silently confirmed or overwritten.
- **No post-write fetchVote:** `createVote` and `deleteVote` must not call `fetchVote()` after writing. This was the source of RC-2 and RC-3 in the current architecture. The debounced event handler is the sole reconciliation path.
- **Duplicate event:** two INSERT events for the same vote trigger two `debouncedFetchVotes` calls. The debounce collapses them to one network call; `setVotes` is idempotent on the same data.

### Realtime Behavior

- Two event types on `votes` table: INSERT and DELETE, filtered by `room_id=eq.${roomId}`.
- Both trigger `debouncedFetchVotes` — 50ms trailing-edge debounce.
- A burst of N vote events within 50ms collapses to one `fetchVotes` call. N events with gaps >50ms produce N separate versioned calls.

### Stale-State Risks

| Risk | Condition | Guard |
|---|---|---|
| Optimistic entry not confirmed | Server rejects the insert | Not guarded in current spec — `createVote` error handling removes the optimistic entry via `removeVote` |
| Stale response overwrites correct map | Two concurrent events, older fetch resolves later | versionedFetch on `fetchVotes` |
| Pre-join votes invisible | No bootstrap fetch in current architecture | Eliminated: `fetchVotesAPI` in Stage 4 covers all pre-existing votes |

---

## Domain 3b — Vote Results

**Store:** `useVoteStore` (`store/vote/useVoteStore.ts`)
**Persisted:** no
**Fields:** `voteResults: VoteResults[]`

### Authoritative Source

`GET /api/vote/result?roomId=` — server-computed aggregate counts. The server is the only entity that computes counts. Client-side derivation from `votesMap` is forbidden.

### Allowed Writers

| Writer | Function | Type | Trigger |
|---|---|---|---|
| `RoomSessionProvider` bootstrap | `useVoteStore.getState().setVoteResults(results)` | refetch | Stage 4 `fetchVotesAPI` resolves |
| `fetchVotes` versionedFetch | `useVoteStore.getState().setVoteResults(data.results)` | refetch | votes INSERT/DELETE event (debounced 50ms) |
| Effect cleanup | cleared via `clearVotes()` | clear | unmount |

### Update Strategy

Refetch-only. `voteResults` is never patched, never computed client-side from `votesMap`. The same `fetchVotes` call that updates `votesMap` also updates `voteResults` — they are always written together from the same response.

### Reconciliation Strategy

- `voteResults` and `votesMap` are always written atomically from the same API response. They cannot diverge post-fetch.
- **No post-write fetch from `createVote`/`deleteVote`:** these actions do not update `voteResults` directly. The realtime echo + debounced `fetchVotes` is the only reconciliation path. This eliminates RC-2 (vote results flicker from concurrent `fetchVote` calls) and RC-3 (stale overwrite from racing responses).

### Realtime Behavior

Same channel event as Domain 3a — `debouncedFetchVotes` updates both `votesMap` and `voteResults` in one call.

### Stale-State Risks

| Risk | Condition | Guard |
|---|---|---|
| `voteResults` diverges from `votesMap` | Current architecture: `votesMap` patched by realtime events, `voteResults` updated by post-write `fetchVote` | Eliminated: both written from the same `fetchVotes` response |
| Stale `voteResults` overwrites correct value | Two rapid votes, older fetch resolves later (RC-3) | versionedFetch + 50ms debounce: at most one in-flight `fetchVotes` per 50ms window |
| `voteResults` computed client-side | Developer computes counts from `votesMap` | Forbidden — only `GET /api/vote/result` may produce counts |

---

## Domain 4 — Options

**Store:** `useOptionStore` (`store/option/useOptionStore.ts`)
**Persisted:** no
**Fields:** `optionsMap: Map<string, Option>`

### Authoritative Source

`GET /api/option/[roomId]` — returns full `Option[]` for the room.

### Allowed Writers

| Writer | Function | Type | Trigger |
|---|---|---|---|
| `RoomSessionProvider` bootstrap | `useOptionStore.getState().setOptions(options)` | refetch | Stage 4 `fetchOptionsAPI` resolves |
| `fetchOptions` versionedFetch | `useOptionStore.getState().setOptions(data)` | refetch | `options` INSERT event |
| `fetchOptions` versionedFetch | `useOptionStore.getState().setOptions(data)` | refetch | `options` DELETE event |
| Effect cleanup | `useOptionStore.getState().setOptions([])` | clear | unmount |

### Update Strategy

Refetch-only. `setOptions` always replaces the entire map. No incremental `addOption` or `removeOption` from external callers. Both INSERT and DELETE events call the same `fetchOptions` function.

`addOption` and `removeOption` remain as internal Zustand methods but must not be called by any code outside the store's own internals. They may be deleted if `setOptions` is always the write path.

### Reconciliation Strategy

- **Duplicate INSERT event:** triggers a second `fetchOptions`, returns the same list. Idempotent.
- **INSERT + DELETE within one window:** both trigger `fetchOptions`. versionedFetch orders them — later call wins.
- **Bootstrap fetch vs. early events:** options are pre-populated at Stage 4 from `fetchOptionsAPI`. Any INSERT or DELETE that fires before Stage 4 completes will trigger a `fetchOptions` call. versionedFetch ensures the latest call wins.

### Realtime Behavior

- Two event types on `options` table: INSERT and DELETE, filtered by `room_id=eq.${roomId}`.
- Both handlers call `fetchOptions(roomId)`. No debounce — options changes are low-frequency and user-initiated.

### Stale-State Risks

| Risk | Condition | Guard |
|---|---|---|
| Cross-slice mutation | `useRoomStore.joinRoom` calls `useOptionStore.getState().setOptions(data.options)` in current code | Forbidden in target; provider bootstrap owns option initialisation |
| Redundant fetch | `room/page.tsx` calls `fetchOption(roomId)` in `onRoomJoined` callback in current code | Deleted in target; provider bootstrap covers this |
| Stale response overwrites current | Two concurrent events, older fetch resolves later | versionedFetch on `fetchOptions` |

---

## Domain 5 — Presence / Ready State

**Store:** `useRoomReadyStore` (`store/room/useRoomReadyStore.ts`)
**Persisted:** no
**Fields:** `readyMembers: string[]`, `totalMembers: number`, `memberNames: Map<string, string>`

### Authoritative Source

Supabase Presence WebSocket state — `channel.presenceState<PresencePayload>()`. This is a local read of the WebSocket's in-memory presence table; no network call is made.

### Allowed Writers

| Writer | Function | Type | Trigger |
|---|---|---|---|
| `syncPresence(channel)` | `setTotalMembers`, `setReady`, `setMemberNames` | derived | `presence` sync event on channel |
| Effect cleanup | `useRoomReadyStore.getState().clearReady()` | clear | unmount |

`syncPresence` is the only write path. It is never called directly by a component or page.

```typescript
function syncPresence(channel: RealtimeChannel) {
  const state = channel.presenceState<PresencePayload>();
  const allUsers = Object.keys(state);
  useRoomReadyStore.getState().setTotalMembers(allUsers.length);
  useRoomReadyStore.getState().setReady(
    allUsers.filter(k => state[k]?.[0]?.isReady === true)
  );
  useRoomReadyStore.getState().setMemberNames(
    new Map(allUsers.map(k => [k, state[k]?.[0]?.name ?? k]))
  );
}
```

### Update Strategy

Derived-only. Every `presence sync` event replaces all three fields atomically from the current `presenceState()` snapshot. No patch, no partial update. `setReady` replaces the full array; `setTotalMembers` replaces the count; `setMemberNames` replaces the full map.

### Reconciliation Strategy

- **`sendReady` path:** `sendReady(channel, userId, name)` calls `channel.track({ isReady: true, ... })`. Supabase broadcasts a presence update; all clients (including the caller) receive a `sync` event; `syncPresence` fires; `readyMembers` is updated. `sendReady` never writes to `useRoomReadyStore` directly.
- **Self-track race:** after `channel.track({ isReady: false })` at the end of Stage 4, Supabase may take up to ~300ms to echo back the `sync` event. During that window, `totalMembers` may not include self. `syncPresence` self-corrects on the next `sync` event. No polling loop is needed or permitted.
- **Duplicate `sync` event:** `syncPresence` reads live `presenceState()` on every call — always current, never stale. Duplicate events produce identical writes.

### Realtime Behavior

- Single event type: `presence sync` on the room channel.
- `join` and `leave` presence events are registered on the channel but have empty handlers — all logic lives in `sync`.
- `sync` fires on every presence change (join, leave, track update). It fires at least once after channel subscription.

### Stale-State Risks

| Risk | Condition | Guard |
|---|---|---|
| Self absent from presence after bootstrap | `track()` is fire-and-forget; `sync` echo may lag ~300ms | Acceptable — `syncPresence` self-corrects on next `sync` event; no polling |
| Polling loop writes directly | Current `useRoomRealtimeReadyStore.ts:54–90` polls and writes `setTotalMembers`/`setReady` | Polling loop deleted with the file; only `syncPresence` writes these fields |
| `addReady` called from component | Patch bypasses `syncPresence`; presence state and store state diverge | `addReady` must never be called externally; method may be deleted |

---

## Domain 6 — Connection State

**Not a Zustand domain.** Connection state is local React state owned by `RoomSessionProvider`.

### Authoritative Source

Supabase WebSocket subscribe callback — status strings `SUBSCRIBED`, `CHANNEL_ERROR`, `TIMED_OUT`.

### Allowed Writers

| Field | Type | Written by | Trigger |
|---|---|---|---|
| `isJoined: boolean` | `useState` in `RoomSessionProvider` | `setIsJoined(true)` | Stage 4 all Promise.all resolved, `aborted=false` |
| `isJoined: boolean` | `useState` in `RoomSessionProvider` | `setIsJoined(false)` | Stage 8 cleanup |
| `channel: RealtimeChannel \| null` | `useState` in `RoomSessionProvider` | `setChannel(channel)` | Stage 4 completion |
| `channel: RealtimeChannel \| null` | `useState` in `RoomSessionProvider` | `setChannel(null)` | Stage 8 cleanup |
| `error: string \| null` | `useState` in `RoomSessionProvider` | `setError(msg)` | subscribe failure or bootstrap failure |

### Update Strategy

Direct `useState` setter calls. No versionedFetch, no optimistic write, no derived computation.

### Reconciliation Strategy

- `isJoined` transitions: `false` (initial) → `true` (Stage 4 complete) → `false` (Stage 8 cleanup). No other values.
- `error` is set on failure and cleared by cleanup. No automatic retry — user must refresh.
- `aborted = true` is set as the first action of cleanup, preventing any in-flight Stage 4 `.then()` callbacks from writing `isJoined=true` or `setChannel` after the session has ended.

### `useUiStore` entries related to connection

| Key | Written by | Cleared by |
|---|---|---|
| `subscriptionError` | `RoomSessionProvider` subscribe or bootstrap failure | next successful subscribe |
| `joinRoomLoading` | `useRoom.joinRoom` loading wrapper | `joinRoom` finally block |

### Realtime Behavior

The subscribe callback is the only realtime input. It fires once per channel lifecycle with `SUBSCRIBED`, `CHANNEL_ERROR`, or `TIMED_OUT`. There is no ongoing event stream for connection state — it is set once at bootstrap.

### Stale-State Risks

| Risk | Condition | Guard |
|---|---|---|
| `isJoined=true` after cleanup | In-flight Stage 4 `.then()` fires after unmount | `aborted=true` guard — all `.then()` callbacks check `if (aborted) return` |
| Two channels live simultaneously | `[roomId, userId]` deps change triggers new effect before cleanup runs | React runs cleanup synchronously before the new effect — no overlap window |
| `subscribedRoomIdRef` out of sync | Current architecture: ref set unconditionally, not cleared on partial failure | Eliminated: ref replaced by provider's `[roomId, userId]` effect deps |

---

## Threat Analysis

### Hidden Writes (current architecture violations, eliminated in target)

| Hidden write | File | Problem | Target fix |
|---|---|---|---|
| `useRoomStore.joinRoom` writes `started_at: now+24h` | `useRoomStore.ts:131` | Fabrication; any truthiness check passes immediately | Delete; `started_at` comes from `fetchRoomAPI` only |
| `useRoomStore.joinRoom` calls `useOptionStore.getState().setOptions(...)` | `useRoomStore.ts:148` | Cross-slice mutation hidden inside a room action | Delete; provider bootstrap owns option initialisation |
| `room/page.tsx` calls `addMember(user.id)` in `onRoomJoined` callback | `room/[roomId]/page.tsx:30` | Optimistic patch bypasses refetch path; count wrong for other members | Delete; provider's `fetchMembers` covers self |
| `lobby/page.tsx` calls `addMember(user.id)` in `onRoomJoined` callback | `lobby/page.tsx:37` | Same as above | Delete |
| `room/page.tsx` calls `fetchOption(roomId)` in `onRoomJoined` callback | `room/[roomId]/page.tsx:28` | Redundant second write after provider already fetched options | Delete |
| `useRoomRealtimeStore` calls `addMember` on INSERT | `useRoomRealtimeStore.ts:22` | Incremental patch; pre-existing members never appear | Store deleted; replaced by `fetchMembers` refetch |

### Stale Overwrites

| Risk | Domain | Guard |
|---|---|---|
| Old `fetchVotes` response resolves after newer one | `voteResults`, `votesMap` | versionedFetch on `fetchVotes` |
| Old `fetchMembers` response resolves after newer one | `members` | versionedFetch on `fetchMembers` |
| Bootstrap fetch resolves after cleanup fired | all slices | `aborted=true` checked in every `.then()` callback |
| Stale `currentRoom` from localStorage visible on mount | `currentRoom` | `RoomGuard` holds loading state until `isJoined=true` |

### Cross-Slice Mutations (current → target)

| Current | Target |
|---|---|
| `useRoomStore.exitRoom` calls `.getState()` on 8 external stores | Provider effect cleanup owns all store clears; `exitRoom` clears only its own slice |
| `useRoomStore.joinRoom` calls `useOptionStore.getState().setOptions()` | Deleted; provider bootstrap owns option initialisation |
| `useRoomLifeCycle` manually calls `clearVotes`, `clearMembers`, `setOptions([])` | Moved into provider effect cleanup; lifecycle hook deleted |

### Duplicate Event Corruption

| Event source | How duplicate is handled |
|---|---|
| `room_members` INSERT duplicate | `fetchMembers` → `setMembers([...])` — full replace, idempotent |
| `room_members` DELETE duplicate | Same — `fetchMembers` → `setMembers([...])` |
| `votes` INSERT duplicate | 50ms debounce collapses burst; `setVotes` full replace |
| `votes` INSERT + optimistic `addVote` | Map dedup on `id` prevents double-entry in `votesMap`; `setVotes` from refetch overwrites |
| `presence` sync duplicate | `syncPresence` reads live `presenceState()` — always current, never stale |
| `options` INSERT duplicate | `fetchOptions` → `setOptions([...])` — full replace, idempotent |

---

## Write-Path Summary

One row per setter. Every call site not listed under "Permitted callers" is forbidden.

| Setter | Permitted callers | Forbidden callers |
|---|---|---|
| `useRoom.setCurrentRoom` | Provider bootstrap, provider `room` UPDATE handler, `createRoom`, `startRoom` | Any page, any other store |
| `useRoom.exitRoom` | Provider effect cleanup only | `useRoomLifeCycle`, any page directly |
| `useRoomMemberStore.setMembers` | `fetchMembers` versionedFetch only | Any page, `addMember`, `removeMember` directly |
| `useOptionStore.setOptions` | `fetchOptions` versionedFetch, provider bootstrap | `joinRoom`, any page's `fetchOption` callback |
| `useVoteStore.setVotes` | `fetchVotes` versionedFetch, provider bootstrap | Any post-write call in `createVote` / `deleteVote` |
| `useVoteStore.setVoteResults` | `fetchVotes` versionedFetch, provider bootstrap | Client-side computation from `votesMap`, `createVote`, `deleteVote` |
| `useVoteStore.addVote` | `createVote` optimistic only | Realtime event handlers (replaced by refetch) |
| `useVoteStore.removeVote` | `deleteVote` optimistic only | Realtime event handlers |
| `useRoomReadyStore.setReady` | `syncPresence` only | Any direct call from component or hook, any polling loop |
| `useRoomReadyStore.setTotalMembers` | `syncPresence` only | Same |
| `useRoomReadyStore.setMemberNames` | `syncPresence` only | Same |
| `useUiStore.setError('subscriptionError')` | `RoomSessionProvider` subscribe / bootstrap failure | `useRealtimeRoom` (deleted) |
