# FRONTEND.md
> Developer reference for the Deal Na frontend. Describes stores, realtime, components, and page hierarchy.

## Page Routes & Flow

```
/ (Login)
  → /topic            (enter topic)
  → /option           (enter options)
  → /room             (create room → redirect to lobby)
  → /room/[roomId]/lobby    (Lobby: QR share, options, ready, host starts)
  → /room/[roomId]          (Vote Session: +/- votes, Lock In)
  → /room/[roomId]/result   (Result: winners, rankings, exit)
```

Navigation is driven by data state, not user action:
- Lobby → Vote: `room.started_at` changes from `null` to a timestamp (caught by realtime room change → `["room", roomId]` invalidation)
- Vote → Result: all DB members are in `lockedMembers` (vote page uses the members query as denominator; presence `totalMembers` lags ~300 ms)

---

## Provider / Layout Hierarchy

```
layout.tsx (root)
└── Providers                    Providers.tsx (TanStack QueryClient)
    └── AuthProvider             Guard/AuthProvider.tsx
        └── [page routes]
            └── room/[roomId]/layout.tsx
                └── RoomSessionProvider          room/[roomId]/RoomSessionProvider.tsx
                    └── RoomGuard                component/room/RoomGuard.tsx
                        └── Page content
```

- **Providers** — wraps the app in the TanStack `QueryClientProvider`
- **AuthProvider** — initializes Supabase session on mount; listens `onAuthStateChange` → writes `useAuth`
- **RoomSessionProvider** — owns the Supabase Realtime channel; invalidates query slices and tracks presence; exposes `RoomSessionContext`
- **RoomGuard** — 4-state FSM: `auth-check → error → loading → children`. Gates page render on `isJoined === true`

---

## Zustand Stores

Most server state moved to TanStack Query (see next section). Only two Zustand
stores remain — auth and UI flags.

| Store | State | Key Actions | Persisted |
|---|---|---|---|
| `useAuth` | `user`, `session` | `loginWithProvider`, `signOut`, `setSession` | No |
| `useUiStore` | `loading: Record<UiKey, bool>`, `error: Record<UiKey, str>`, `isPopup` | `setLoading`, `setError`, `isLoading`, `getError`, `clearAll` | No |

---

## Data Layer (TanStack Query)

QueryClient is provided in `Providers.tsx`. Room/member/option/vote state is no
longer in Zustand — it lives in query caches keyed by `roomId`.

**Query hooks** — `hooks/query/`

| Hook | Query key | Returns |
|---|---|---|
| `useRoomQuery` | `["room", roomId]` | `Room` |
| `useMembersQuery` | `["members", roomId]` | `string[]` (user ids) |
| `useOptionsQuery` | `["options", roomId]` | `Option[]` |
| `useVotesQuery` | `["votes", roomId]` | `{ votes, formattedResult }` (`VotesQueryData`) |
| `useVoteResultsQuery` | — | aggregated results (file: `๊useVoteResultsQuery.tsx` — stray leading char, rename candidate) |

**Mutation hooks** — `hooks/mutation/`: `useCreateRoomMutation`,
`useExitRoomMutation`, `useVoteMutations` (`addVote` / `removeVote`),
`useOptionMutations` (`addOption`).

**API client:** `lib/roomAPI.ts`. Realtime events only **invalidate** these query
keys (see Realtime section) — TanStack Query refetches.

---

## Realtime (Supabase Channel)

**Owner:** `RoomSessionProvider` exclusively. One channel per room: `room:${roomId}`
(`config.presence.key = userId`).

**Handlers, registered before `.subscribe()`** — 4 `postgres_changes` (`event: "*"`) + 1 presence sync:

| Event | Table / Source | Action |
|---|---|---|
| `presence` sync | — | recompute `totalMembers`, `readyMembers` (`status`), `lockedMembers` (`locked`), `memberNames` |
| `postgres_changes` `*` | `votes` | `invalidateQueries(["votes", roomId])` |
| `postgres_changes` `*` | `room_members` | `invalidateQueries(["members", roomId])` |
| `postgres_changes` `*` | `options` | `invalidateQueries(["options", roomId])` |
| `postgres_changes` `*` | `room` | `invalidateQueries(["room", roomId])` |

**Reconciliation model:** realtime events are invalidation signals only — each
invalidates a query key and TanStack Query refetches. No debounce, no module-level
version counters, no direct store patching.

**Presence meta shape:**
```typescript
{ user_id: string; name?: string; status?: boolean; locked?: boolean }
```
`status` = lobby-ready (gates the host's Start button); `locked` = vote-locked
(when all members are locked → Result). The presence sync handler derives
`readyMembers` / `lockedMembers` / `memberNames` from these. `track()` replaces the
whole payload, so self-writes merge through `selfMetaRef`. `sendReady` / `sendUnready`
toggle `status`; `sendLock` / `sendUnlock` toggle `locked`.

**Subscribe / cleanup:** on `SUBSCRIBED`, `track(selfMetaRef)` then `setIsJoined(true)`.
Cleanup calls `untrack()` + `unsubscribe()`.

---

## Component Hierarchy Per Page

### Lobby (`/room/[roomId]/lobby`)
```
RoomSessionProvider
└── RoomGuard
    ├── Header (room title)
    ├── ShareRoom (QR code + URL + copy button)   → uses Portal
    ├── Member count badge
    ├── [Host only] "Start Voting" button          → startRoom action
    └── [Guest] "Waiting for host..." message
```
Reads: `useAuth`, `useRoomQuery`, `useOptionsQuery`, `useOptionMutations`, `useRoomSession`

### Vote Session (`/room/[roomId]`)
```
RoomSessionProvider
└── RoomGuard
    └── VoteOptions
        ├── [if not ready]
        │   ├── VoteOptionItem[] (per option)
        │   │   ├── VoteOptionContent (title)
        │   │   ├── VoteCountBadge
        │   │   └── VoteButton (+ / -)
        │   └── ReadyButton
        └── [if ready — Locked State]
            ├── "You're locked in" message
            └── ReadinessSlots (member ready status list)
```
Reads: `useAuth`, `useOptionsQuery`, `useVotesQuery`, `useMembersQuery`, `useVoteMutations`, `useRoomSession`
Hooks: `useVoteStats` (myVotes, remainingVotes)

**Locked State trigger:** user's own id is in `lockedMembers` (after `sendLock()` resolves).
**Result redirect trigger:** every DB member (from `useMembersQuery`) is in `lockedMembers`.

### Result (`/room/[roomId]/result`)
```
RoomSessionProvider
└── RoomGuard
    ├── WinnersSection (top-voted options)
    ├── VoteResultsList
    │   └── VoteResultItem[] (title, count, %, progress bar)
    ├── Total votes display
    ├── ExitRoomButton
    └── LogoutButton
```
Reads: `useRoomQuery`, `useVotesQuery`, `useRoomSession`
Hooks: `useVoteResult` (winners, results with %, totalVotes)

---

## Custom Hooks

| Hook | Returns | Stores/Context |
|---|---|---|
| `useVoteStats` | `myVotes`, `remainingVotes` | takes `votes`, `userId`, `maxVotes` |
| `useVoteResult` | `winners`, `results` (with %), `totalVotes` | (pure — takes `voteResults` as input) |
| `useCreateRoomMutation` | create-room mutation | `hooks/mutation/`, `RoomFormContext` |
| `useExitRoomMutation` | exit-room mutation | `hooks/mutation/`, router |
| `useCurrentRoom` | current-room accessor | `hooks/` |
| `useAsyncAction(key)` | `execute`, `isLoading`, `error` | `useUiStore` |
| `useClipboard` | `isCopied`, `copyToClipboard(text)` | — |
| `usePortal` | portal render function | — |
| `useRoomSession` | full session context (own file `hooks/useRoomSession.tsx`) | `RoomSessionContext` |

---

## Shared Components

### Buttons
| Component | Purpose |
|---|---|
| `VoteButton` | Generic +/- vote button with disabled state |
| `ReadyButton` | "READY?" — calls `sendReady()` via `RoomSessionContext` |
| `CreateRoomButton` | Submit room creation form |
| `ExitRoomButton` | Exit room with confirm dialog |
| `LogoutButton` | Sign out (full or mini size) |
| `LoginButton` | Facebook / Google OAuth |
| `DeleteOptionButton` | Delete an option (creator only) |

### Auth UI
| Component | Purpose |
|---|---|
| `EmailLoginForm` | Email login form (`component/auth/`) |
| `DevQuickLogin` | Dev/test quick login (`component/auth/`) |

### Vote UI
| Component (export) | File | Purpose |
|---|---|---|
| `VoteOptionItem` | `VoteOptionItems.tsx` | Option card: title + badge + +/- buttons |
| `VoteOptionContent` | — | Option title text |
| `VoteCountBadge` | — | Circle badge with vote count |
| `VoteResultItem` | — | Result row: title, count, %, progress bar |
| `VoteResultsList` | `VoteResultList.tsx` | Wraps result items |
| `WinnersSection` | `WinnerSection.tsx` | Top-voted options header block |

### Room UI
| Component | Purpose |
|---|---|
| `RoomGuard` | Blocks page until `isJoined`; shows auth/error/loading states |
| `ReadinessSlots` | Ready/not-ready member list with names |
| `OptionForm` | Options input form (up to 3 options) |
| `ShareRoom` | QR code + URL modal via Portal |

### Layout / Decor
| Component | Purpose |
|---|---|
| `LoadingPage` | Spinner with title + subtitle |
| `ErrorPage` | Error message + retry button |
| `UserMenu` | Avatar dropdown with logout |
| `Confetti` | Decorative confetti (`component/decor/`) |

Utility: `lib/cn.ts` (className merge).

---

## Async Action Patterns

### `useAsyncAction(key: UiKey)` — hooks/components
```typescript
const { execute, isLoading, error } = useAsyncAction('createVoteLoading');
execute(async () => { ... });
```
Internally calls `executeWithUI` from `actionHelper.ts`.

### `actionWrapper` / `roomActionWrapper` — `utils/actionWrapper.ts`
Auto-injects `{ userId, roomId, token }` via `getRequiredContext()` (`utils/context.ts`).

---

## Types (`types/index.ts`; CSS module decls in `types/css.d.ts`)

| Type | Defined In | Key Fields (snake_case) |
|---|---|---|
| `Room` | `types/index.ts` | `id`, `room_code`, `title`, `created_at`, `expired_at`, `created_by`, `started_at: string \| null`, `url?` |
| `Option` | `types/index.ts` | `id`, `title`, `user_id` |
| `Vote` | `types/index.ts` | `id`, `option_id`, `room_id`, `user_id` |
| `VoteResult` | `types/index.ts` | `optionId`, `title`, `voteCount` |
| `VotesQueryData` | `types/index.ts` | `votes: Vote[]`, `formattedResult: VoteResult[]` |
| `UiKey` | `useUiStore.ts` | UI-key union |
| `PresenceMeta` | `RoomSessionProvider.tsx` | `user_id`, `name?`, `status?`, `locked?` |
| `RoomSessionContextValue` | `RoomSessionProvider.tsx` | `isJoined`, `error`, `totalMembers`, `readyMembers`, `lockedMembers`, `memberNames`, `sendReady`, `sendUnready`, `sendLock`, `sendUnlock` |
