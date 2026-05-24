# Decision Log

---

## [2026-05-24] Room join: use JWT identity, not body userId

**Problem**
The `POST /api/room/[roomId]` route accepted `userId` from the request body and inserted
it directly into `room_members`. Anyone with a valid login could send a different `userId`
and join a room as someone else.

**Decision**
Stop reading `userId` from the body. The route already validates the JWT via `requireAuth`,
which returns the real `user.id` — use that instead.

**What changed**
- `src/app/api/room/[roomId]/route.ts` — removed `userId` from body parse; uses `user.id` from JWT
- `src/app/lib/roomAPI.ts` — removed `userId` from `joinRoomAPI` body payload
- `src/app/store/room/useRoomStore.ts` — updated call site to match new signature

**Why this is safe**
Supabase verifies the JWT on the server (`getUser()`). The identity written to the DB
now always matches the authenticated caller — no client input involved.

---

## [2026-05-24] roomAPI: accept token as parameter, remove internal getSession()

**Problem**
`createRoomAPI` and `joinRoomAPI` called `supabase.auth.getSession()` internally to
get the token. Everything else in the app reads the token from the Zustand `useAuth`
store. During a token refresh, these two sources could briefly disagree — causing a
stale token to be sent and a silent 401 from the API.

**Decision**
Make `roomAPI.ts` a pure HTTP layer: accept `token` as a parameter, remove the
Supabase SDK import entirely. The store (`useRoomStore`) reads the token from
`useAuth.getState().session?.access_token` — the same single source used everywhere
else — and passes it down. Added an explicit null-check so an expired session throws
a clear error instead of sending an empty Authorization header.

**What changed**
- `src/app/lib/roomAPI.ts` — removed `getSession()` and Supabase import; `token`
  is now a required parameter on both functions; also removed stale `userId` from
  `createRoomAPI` body (server ignores it)
- `src/app/store/room/useRoomStore.ts` — added `useAuth` import; both `createRoom`
  and `joinRoom` now read the token from Zustand before calling the API

---

## [2026-05-24] AuthProvider: drop `getSession()`, use `onAuthStateChange` only

**Problem**
`AuthProvider` called both `getSession()` and subscribed to `onAuthStateChange`. The
listener fired `INITIAL_SESSION` synchronously and cleared `loadingSession` before
`getSession()` resolved. If that fired with no session, `AuthGuard` could see
`!loading && !user` and redirect — a false logout flash.

**Decision**
Remove `initializeAuth`/`getSession()` entirely. Set `loadingSession = true` before
subscribing, then let `INITIAL_SESSION` from `onAuthStateChange` clear it. One code
path owns loading state.

**What changed**
- `src/app/Guard/AuthProvider.tsx` — deleted `initializeAuth`, `mountedRef`,
  `initializedRef`; replaced with a single `onAuthStateChange` subscription

**Why this is safe**
Supabase v2 guarantees `INITIAL_SESSION` fires synchronously on subscribe with the
stored session — it is the canonical initialization event. `getSession()` was reading
from the same storage and returning the same value, making it redundant.

---

## [2026-05-24] Drop dead userId param from createRoom and joinRoom

**Problem**
After the identity spoofing fix (step 1) and token consolidation (step 3), `userId`
was still declared as a parameter on `createRoom` and `joinRoom` in both the interface
and implementations, but was never used. Callers were still passing `user.id` into
the void. Found by scrutinize review.

**Decision**
Remove `userId` from signatures, interface, and all call sites.

**What changed**
- `src/app/store/room/useRoomStore.ts` — removed `userId` from `RoomState` interface,
  `createRoom`, and `joinRoom` implementations
- `src/app/hooks/useCreateRoom.tsx` — removed `user.id` argument from `createRoom` call
- `src/app/hooks/useRoomLifeCycle.tsx` — removed `user.id` argument from `joinRoom` call
