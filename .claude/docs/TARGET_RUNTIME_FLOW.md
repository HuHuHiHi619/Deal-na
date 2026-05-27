# TARGET_RUNTIME_FLOW.md — Exact Execution Trace

> Exact execution trace for the target architecture.
> Every function call, state transition, and timing dependency is named.
> No design intent — only what runs, in what order, with what effect on store state.
> The high-level design is in TARGET_FLOW.md.
> The ownership rules are in OWNERSHIP_MATRIX.md.
>
> **Implementation status:** Stage 1 complete as of `fix/batch1-realtime-subscription-errors`.
> Stages marked ✅ are live in `RoomSessionProvider`. Unmarked stages (reconnect recovery) remain pending.

---

## Component Tree

```
layout.tsx
  └─ RoomSessionProvider (roomId from params)
       ├─ state: { isJoined, channel, currentRoom, error }
       ├─ context: RoomSessionContext → { channel, isJoined, currentRoom, error }
       └─ children (rendered only when isJoined=true)
            ├─ lobby/page.tsx   → reads RoomSession context
            ├─ page.tsx         → reads RoomSession context
            └─ result/page.tsx  → reads RoomSession context
```

`RoomSessionProvider` is the only component that touches the Supabase channel. Pages are pure consumers of context + Zustand slice selectors.

---

## Stage 0 — Initial Render ✅

**Trigger:** `layout.tsx` mounts for `/room/[roomId]/*`

```
RoomSessionProvider initialises:
  isJoined    = false
  channel     = null
  currentRoom = null
  error       = null

Renders loading skeleton (isJoined=false gates children via RoomGuard or equivalent).
useEffect([roomId, userId]) is queued — has not fired yet.
```

Store state at this point:

| Store | State |
|---|---|
| `useRoomStore` | `currentRoom` may be populated from localStorage (stale from previous session) |
| `useRoomMemberStore` | `members: []` |
| `useOptionStore` | `optionsMap: Map {}` |
| `useVoteStore` | `votesMap: Map {}, voteResults: []` |
| `useRoomReadyStore` | `readyMembers: [], totalMembers: 0` |

---

## Stage 1 — Auth Gate ✅

**Trigger:** `useEffect([roomId, userId])` fires after first paint

```typescript
const { user } = useAuth();         // reads Zustand — already hydrated by AuthProvider
const userId = user?.id;
const token  = user?.session?.access_token;

if (!userId || !token) {
  // render loading — effect returns, no channel constructed
  // re-fires automatically when userId resolves (dep change)
  return;
}
```

If auth is hydrating from localStorage, this effect returns and re-fires when `userId` becomes available. No channel is ever constructed without a valid `userId`.

---

## Stage 2 — Channel Construction ✅

**Trigger:** Still inside the same `useEffect` run, `userId` is confirmed present

```typescript
let aborted = false;                // guards all async callbacks below

const channel = supabase.channel(`room:${roomId}`, {
  config: { presence: { key: userId } }   // INV-3: key bound at construction time
});

// Register all 8 handlers BEFORE calling .subscribe()
channel
  .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'room', filter: `id=eq.${roomId}` },
      () => fetchRoom(roomId))

  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
      () => fetchMembers(roomId))

  .on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
      () => fetchMembers(roomId))

  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'options', filter: `room_id=eq.${roomId}` },
      () => fetchOptions(roomId))

  .on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'options', filter: `room_id=eq.${roomId}` },
      () => fetchOptions(roomId))

  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
      debouncedFetchVotes)               // 50 ms trailing-edge debounce

  .on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
      debouncedFetchVotes)

  .on('presence', { event: 'sync' },
      () => syncPresence(channel));      // 'join' / 'leave' handlers intentionally omitted —
                                         // all presence logic lives in 'sync'
```

Channel is fully configured. No network activity yet. No handler has fired.

---

## Stage 3 — Subscribe ✅

**Trigger:** Immediately after handler registration in Stage 2

```typescript
const subscribePromise = new Promise<void>((resolve, reject) => {
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      resolve();
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      supabase.removeChannel(channel);           // INV-5: no orphan channel
      reject(new Error(`channel ${status}`));
    }
  });
});
```

**While waiting for `SUBSCRIBED`:** no inserts, no fetches, no store writes. The loading skeleton remains.

**On rejection:**

```typescript
.catch((err) => {
  if (!aborted) {
    setError(err.message);          // surfaces to RoomGuard
    // channel already removed in subscribe callback above
  }
});
```

Effect cleanup still runs on unmount even in the error state.

---

## Stage 4 — Bootstrap (after SUBSCRIBED) ✅

**Trigger:** `subscribePromise` resolves — channel is now live

```typescript
if (aborted) { supabase.removeChannel(channel); return; }  // tab closed during subscribe

const [, room, members, options, votesData] = await Promise.all([
  joinRoomAPI(roomId, token),           // [0] POST /api/room/[roomId]
  fetchRoomAPI(roomId, token),          // [1] GET  /api/room/[roomId]
  fetchMembersAPI(roomId, token),       // [2] GET  /api/room/[roomId]/members
  fetchOptionsAPI(roomId, token),       // [3] GET  /api/option/[roomId]
  fetchVotesAPI(roomId, token),         // [4] GET  /api/vote/result?roomId=...
]);

if (aborted) return;
```

**Ordering guarantee on [0] vs [2]:**
- `joinRoomAPI` [0] POSTs the self-INSERT. The DB fires a realtime event.
- The realtime event travels: DB → Supabase Realtime server → WebSocket → client.
- `fetchMembersAPI` [2] resolves before that round-trip completes (in the common case).
- The realtime INSERT event triggers a second `fetchMembers` call via versionedFetch.
- versionedFetch version on the second call is higher → second call wins → self is included.
- **Result: self is in `members` within one RTT of bootstrap completing.**

**Store writes (all synchronous after Promise.all):**

```typescript
// Map snake_case → camelCase at this boundary, nowhere else (INV-7)
useRoom.getState().setCurrentRoom({
  id:        room.id,
  roomCode:  room.room_code,
  title:     room.title,
  status:    room.status,
  createdAt: room.created_at,
  expiredAt: room.expired_at,
  createdBy: room.created_by,
  startedAt: room.started_at ?? null,   // null until host starts — INV-7
  url:       `/room/${room.id}`,
});

useRoomMemberStore.getState().setMembers(members);           // string[]
useOptionStore.getState().setOptions(options);               // Option[]
useVoteStore.getState().setVotes(votesData.votes);           // Vote[]
useVoteStore.getState().setVoteResults(votesData.results);   // VoteResults[]
```

**Mark joined + track presence:**

```typescript
setIsJoined(true);
setChannel(channel);                 // exposed via RoomSessionContext

const name = user.user_metadata?.name ?? user.user_metadata?.full_name ?? user.email;
channel.track({ userId, name, isReady: false, joinedAt: new Date().toISOString() });
// track() is fire-and-forget — presence 'sync' event reconciles state asynchronously
```

**Re-render:** `isJoined=true` → `RoomGuard` unmounts skeleton, renders children. Room title, member list, options, and votes are all visible immediately from store state.

---

## Stage 5 — Live Session: Event Dispatch Table ✅

Every realtime event follows this chain: **event arrives → handler fires → versionedFetch called → API resolves → version check → setter writes store.**

| Event | Handler | versionedFetch target | Setter | Debounce |
|---|---|---|---|---|
| `room_members` INSERT | `fetchMembers(roomId)` | `GET /api/room/[roomId]/members` | `setMembers(string[])` | none |
| `room_members` DELETE | `fetchMembers(roomId)` | same | `setMembers(string[])` | none |
| `options` INSERT | `fetchOptions(roomId)` | `GET /api/option/[roomId]` | `setOptions(Option[])` | none |
| `options` DELETE | `fetchOptions(roomId)` | same | `setOptions(Option[])` | none |
| `votes` INSERT | `debouncedFetchVotes` | `GET /api/vote/result?roomId=` | `setVotes + setVoteResults` | 50 ms trailing |
| `votes` DELETE | `debouncedFetchVotes` | same | `setVotes + setVoteResults` | 50 ms trailing |
| `room` UPDATE | `fetchRoom(roomId)` | `GET /api/room/[roomId]` | `setCurrentRoom(Room)` | none |
| `presence` sync | `syncPresence(channel)` | *(reads presenceState directly — no network call)* | `setReady, setTotalMembers, setMemberNames` | none |

### versionedFetch contract (per-slice, module-level)

```typescript
// One instance per slice, declared at module level
// Example: fetchMembers in useRoomMemberStore.ts
let version = 0;
export async function fetchMembers(roomId: string) {
  const myVersion = ++version;
  const token = useAuth.getState().session?.access_token;
  if (!token) return;
  const res = await fetch(`/api/room/${roomId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return;
  const members: string[] = await res.json();
  if (myVersion !== version) return;           // stale — a newer call already wrote
  useRoomMemberStore.getState().setMembers(members);
}
```

### Debounce for votes

```typescript
const debouncedFetchVotes = debounce(() => fetchVotes(roomId), 50, { trailing: true });
// Burst of N vote events within 50ms → exactly ONE fetchVotes call fires
// N events with >50ms gaps → N separate versioned calls
```

### syncPresence (no network call)

```typescript
function syncPresence(channel: RealtimeChannel) {
  const state = channel.presenceState<PresencePayload>();
  const allUsers = Object.keys(state);
  const readyUsers = allUsers.filter(k => state[k]?.[0]?.isReady === true);
  const names = new Map(allUsers.map(k => [k, state[k]?.[0]?.name ?? k]));
  useRoomReadyStore.getState().setTotalMembers(allUsers.length);
  useRoomReadyStore.getState().setReady(readyUsers);
  useRoomReadyStore.getState().setMemberNames(names);
}
```

---

## Stage 6 — User Action Flows ✅

### Vote Cast

```
createVote(optionId) called:
  POST /api/vote → server inserts vote row
  optimistic: addVote(newVote) → votesMap updated immediately
  (no fetchVote called here — dropped from createVote)

  ~50–200ms later:
  'votes' INSERT event arrives on channel
  → debouncedFetchVotes timer starts (50ms)

  If no other vote arrives within 50ms:
  → fetchVotes(roomId) fires, version++
  → GET /api/vote/result?roomId=
  → myVersion === version → setVoteResults(data)
  → vote count is authoritative

  If a concurrent vote arrives within the 50ms window:
  → debounce resets timer
  → single fetchVotes covers both votes — one authoritative result
```

### sendReady

```
ReadyButton reads channel from RoomSession context.
sendReady(channel, userId, name) called  [plain helper in useRoomReadyStore.ts]:
  if channel.state !== 'joined': throw Error('Channel not ready')
  channel.track({ userId, name, isReady: true, readyAt: now })
  → Supabase broadcasts presence update to all clients on the channel

All clients (including caller):
  'presence' sync fires → syncPresence(channel)
  → readyMembers updated
  → if readyMembers.length === totalMembers && totalMembers > 0:
       router.push(`/room/${roomId}/result`)
```

### startRoom (host)

```
Host: handleStartVoting() in lobby/page.tsx
  useRoom.getState().startRoom(roomId):
    optimistic: setCurrentRoom({ ...currentRoom, startedAt: new Date().toISOString() })
    → lobby useEffect([currentRoom?.startedAt]) fires → router.push(`/room/${roomId}`)
    Host navigates immediately (optimistic).

    POST /api/room/[roomId]/start
    → UPDATE room SET started_at = NOW() WHERE id = $1
    (RLS enforces host-only; no client-side host check needed)

Guests (and host's own channel after server write):
  'postgres_changes' UPDATE room event fires on all clients' channels
  → fetchRoom(roomId) → GET /api/room/[roomId]
  → setCurrentRoom({ ..., startedAt: '2026-05-27T...' })
  → lobby useEffect([currentRoom?.startedAt]) fires → router.push(`/room/${roomId}`)
  All guests navigate without refresh.
```

---

## Stage 7 — Error Paths ✅

### Channel fails to subscribe

```
CHANNEL_ERROR or TIMED_OUT:
  subscribe callback: supabase.removeChannel(channel)  ← no orphan (INV-5)
  subscribePromise rejects
  .catch: if (!aborted) setError(err.message)
  RoomGuard renders error state.
  Channel is fully cleaned up. No stores were written.
  User may refresh to retry (effect re-fires on mount).
```

### Bootstrap fetch fails (one of the 5 parallel calls)

```
Promise.all rejects on first failure:
  .catch:
    aborted = true
    supabase.removeChannel(channel)   ← channel was SUBSCRIBED — must remove explicitly here
    setError(err.message)
  No store writes have occurred (Promise.all is all-or-nothing).
```

### In-flight fetch after `aborted = true`

```
Cleanup fires (unmount or dep change):
  aborted = true

Any in-flight .then() callback checks:
  if (aborted) return;   ← exits immediately, writes nothing to store
```

This prevents a teardown race where a slow `fetchMembers` response lands after the new room session has already started constructing its channel.

---

## Stage 8 — Cleanup ✅

**Trigger:** `useEffect` cleanup — runs on **unmount** or when `[roomId, userId]` changes (room-to-room navigation, auth token change)

```typescript
return () => {
  aborted = true;                    // guard: all in-flight promises exit on next check

  // Async teardown — fire-and-forget (component is already unmounting)
  channel
    .untrack()
    .catch(() => {})
    .finally(() => supabase.removeChannel(channel));

  // Synchronous store clear
  useRoomMemberStore.getState().clearMembers();
  useOptionStore.getState().setOptions([]);
  useVoteStore.getState().clearVotes();
  useVoteStore.getState().setVoteResults([]);
  useRoomReadyStore.getState().clearReady();
  useRoom.getState().exitRoom();          // clears currentRoom, isJoin

  // Provider local state
  setIsJoined(false);
  setChannel(null);
  setCurrentRoom(null);
  setError(null);
};
```

**If `[roomId, userId]` changed (not unmount):** React runs cleanup synchronously, then immediately fires the new effect. The new bootstrap constructs a fresh channel for the new `(roomId, userId)` pair. There is no window where two channels are live simultaneously.

**localStorage note:** `useRoom` is persisted. `exitRoom` sets `currentRoom: null`. If the user closes the tab without navigating, cleanup does not run and `currentRoom` survives in localStorage. On next mount, the bootstrap sequence overwrites it at Stage 4 Step [1] (`fetchRoomAPI`). Stale data is visible only during the ~200ms subscribe window before `isJoined=true`.

---

## versionedFetch: Concurrent Resolution Example

```
T=0   INSERT event A arrives → fetchMembers called
      membersVersion becomes 1 (myVersion=1)
      GET /api/room/.../members in-flight

T=50  INSERT event B arrives → fetchMembers called
      membersVersion becomes 2 (myVersion=2)
      GET /api/room/.../members in-flight (newer snapshot)

T=120 Request B resolves → myVersion(2) === membersVersion(2) ✓
      setMembers(['a', 'b', 'c'])   ← written

T=180 Request A resolves (slow) → myVersion(1) !== membersVersion(2) ✗
      return   ← stale, dropped silently
```

`setMembers` is only ever called with the most recent snapshot. RC-3 is closed by construction.

---

## State Invariant Checkpoints

| Checkpoint | Required state |
|---|---|
| Before `channel.subscribe()` | All 8 `.on()` handlers registered |
| Before `joinRoomAPI` POST | `subscribePromise` resolved with `SUBSCRIBED` |
| Before `setIsJoined(true)` | All 5 `Promise.all` calls resolved; `aborted=false` |
| Before `sendReady` | `channel.state === 'joined'` |
| Before new bootstrap effect fires | Previous effect cleanup has run: `aborted=true`, channel removed, all stores cleared |

---

## Reconnect Lifecycle ⏳ (Stage 2 — pending)

Supabase auto-reconnects the WebSocket after a network interruption. When the channel re-enters `SUBSCRIBED`, the provider does not automatically re-run bootstrap fetches in the current design — this is an acknowledged limitation acceptable for the initial restructure.

The `[roomId, userId]` effect dep guard prevents double-subscription: the bootstrap effect only fires when `roomId` or `userId` changes. A plain WebSocket reconnect (same room, same user) does not trigger the deps and does not re-run the bootstrap.

If the reconnect window is short enough that Supabase replays any missed events (behaviour depends on Supabase plan and channel configuration), state will self-correct via the event → refetch chain. If events were missed during the outage window, state remains stale until the next event or user action triggers a fetch.
