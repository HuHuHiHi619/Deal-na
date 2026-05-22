# CLAUDE.md
> Behavior rules for Claude Code. Read this file every session before any action.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build with Turbopack
npm run lint         # Run ESLint
npm run test         # Run tests with Vitest
npm run test:ui      # Vitest with browser UI
npm run test:coverage # Generate coverage report
```

Run a single test file:
```bash
npx vitest src/app/utils/validation.test.ts
```

## Environment Variables

Requires `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- NextAuth secrets (for OAuth providers: Facebook, Google)

## Architecture

**Deal Na** is a real-time group voting app. Users create a room with a topic and options, share the room link/QR code, and participants vote. The app uses Supabase Postgres + Realtime, NextAuth for OAuth, and Zustand for client state.

### User flow
1. Land on `/` → login (Google/Facebook OAuth via Supabase, or test user)
2. `/room` → create a room (topic + options) → redirected to `/room/[roomId]`
3. `/room/[roomId]` → vote on options, mark ready
4. `/room/[roomId]/result` → see winner

### Auth
- **`AuthProvider`** (`Guard/AuthProvider.tsx`) wraps the entire app in `layout.tsx`. It initializes the Supabase session on mount and listens to `onAuthStateChange`, syncing state into `useAuth` (Zustand store).
- **`AuthGuard`** (`Guard/AuthGuard.tsx`) is used on protected pages; redirects unauthenticated users to `/?redirect=...`.
- Auth state lives in `store/auth/useAuth.ts` (Zustand). Supports `facebook`, `google`, and `email` providers via `loginWithProvider`.

### Room lifecycle (`hooks/useRoomLifeCycle.tsx`)
This is the central orchestrator for the room experience:
1. Calls `joinRoom` (API + Zustand state) when the user navigates to `/room/[roomId]`
2. After joining, triggers `subscribeAll` (Supabase Realtime) and the `onRoomJoined` callback
3. When the user leaves `/room/` routes, calls `exitRoom` (clears all stores) and `unsubscribeAll`
4. `RoomGuard` component wraps room pages and handles loading/error/unauthenticated states

### Realtime (Supabase channels)
Four parallel Supabase Realtime subscriptions are managed by `useRealtimeRoom`:
- `useRoomRealtimeStore` — listens for room/member inserts
- `useOptionRealtimeStore` — listens for option changes
- `useVoteRealtimeStore` — listens for vote inserts/deletes
- `useRoomRealtimeReadyStore` — listens for ready-state changes per user

All subscribe/unsubscribe calls are coordinated via `Promise.allSettled` to avoid partial states.

### Zustand store structure
```
store/
  auth/useAuth.ts              # Session, user, login/logout
  room/useRoomStore.ts         # currentRoom, joinRoom, exitRoom (persisted to localStorage)
  room/useRoomMemberStore.ts   # Member list for current room
  room/useRoomReadyStore.ts    # Who is ready
  room/useRoomRealtimeStore.ts # Supabase Realtime channel for room
  room/useRoomRealtimeReadyStore.ts
  option/useOptionStore.ts     # Options list, fetch/delete
  option/useOptionRealtimeStore.ts
  vote/useVoteStore.ts         # Votes, createVote, deleteVote
  vote/useVoteRealtimeStore.ts
  useUiStore.ts                # loading/error flags keyed by operation name
  useRoomForm.ts               # Form state for room creation
```

`useRoom` (room store) is persisted with `zustand/middleware/persist` — `currentRoom` and `rooms` survive page refresh.

### API routes (`src/app/api/`)
All routes authenticate by extracting the `Authorization: Bearer <token>` header and calling `getServerUser(token)` from `lib/supabase.ts` (creates a Supabase client with the JWT).

- `POST /api/room/create` — creates room + adds creator to `room_members` + inserts options
- `GET /api/room/[roomId]` — fetch room data
- `GET /api/option/[roomId]` — fetch options for a room
- `GET /api/vote/result` — fetch vote results

### `actionWrapper` pattern
Most store actions call `actionWrapper(loadingKey, { action, onSuccess, onError })` (`utils/actionWrapper.ts`). It:
1. Sets `useUiStore` loading state for the key
2. Calls `getRequiredContext()` to get `{ userId, roomId }` from current store state
3. Runs the action
4. Clears loading / sets error on the UI store

### Path aliases
`@/` maps to `src/` (configured in `vitest.config.ts` and Next.js).

### Testing
Tests use Vitest + jsdom + `@testing-library/react`. Test files sit next to the files they test (`*.test.tsx` / `*.test.ts`). The setup uses `globals: true`, so `describe`/`it`/`expect` don't need imports.

## AI Behavior Guidelines
- **Output Economy**: Be extremely concise. Use code diffs or targeted edits instead of re-printing entire files. No conversational fluff.
- **Security**: NEVER print actual secret values from `.env` files. Mask them as `KEY=******`.
- **Workflow**: Read `TODO.md` to understand current progress before attempting any code changes.