# Auth Architecture Fix Plan

Source: `/src/frontend.md` audit + re-audit (2026-05-24)

---

## ~~Issue 1 — `userId` from body trusted in join route~~ [DONE]

**File:** `src/app/api/room/[roomId]/route.ts`

**Problem:** The route validates the caller's JWT via `requireAuth` but then inserts
`userId` from the request body — not from `auth.user.id`. An attacker with any valid
JWT can forge their identity in `room_members`.

**Fix:**
- Remove `userId` from the parsed body.
- Use `user.id` returned by `requireAuth` for all DB inserts.
- Remove `userId` from the `joinRoomAPI` body in `src/app/lib/roomAPI.ts`.

```ts
// route.ts — BEFORE
const { userId } = await req.json();
.insert({ room_id: roomId, user_id: userId })

// route.ts — AFTER
const auth = await requireAuth(req);
const { user, supabase } = auth;
// userId no longer read from body
.insert({ room_id: roomId, user_id: user.id })
```

**Files to change:**
- `src/app/api/room/[roomId]/route.ts` — stop reading `userId` from body; use `user.id`
- `src/app/lib/roomAPI.ts` — remove `userId` from `joinRoomAPI` body payload

---

## ~~Issue 2 — Direct Supabase writes bypass server auth perimeter~~ [DONE]

**Problem:** `createOption`, `deleteOption`, `createVote`, `deleteVote` all called
`createServerClient(token)` directly from the browser. They skipped Next.js API routes,
so no server-side validation, rate limiting, or application-layer enforcement existed
for any write to `options` or `votes`.

**Fix:** Added four new API route handlers; all mutations now go through the server perimeter.

### ~~2a — `POST /api/option/[roomId]`~~ [DONE]
- Added `POST` handler to existing `src/app/api/option/[roomId]/route.ts`
- Inserts options with `user_id: user.id` from JWT — body userId never trusted

### ~~2b — `DELETE /api/option/[roomId]/[optionId]`~~ [DONE]
- New file: `src/app/api/option/[roomId]/[optionId]/route.ts`
- Note: `[optionId]` at same level as `[roomId]` would collide in Next.js App Router — used nested route instead
- Deletes where `id = optionId AND room_id = roomId AND user_id = user.id`

### ~~2c — `POST /api/vote`~~ [DONE]
- New file: `src/app/api/vote/route.ts`
- Inserts `{ room_id, option_id, user_id: user.id }` from JWT

### ~~2d — `DELETE /api/vote`~~ [DONE]
- Same file as 2c
- Deletes where `room_id = roomId AND option_id = optionId AND user_id = user.id`

**Also fixed:** Two stale callers (`useCreateRoom.tsx:27`, `useRoomLifeCycle.tsx:43`) still passing `userId` to `createRoom`/`joinRoom` after those signatures were previously cleaned up.

**Remaining:** `services/options.ts` and `services/votes.ts` are now dead code → Issue 5.

---

## ~~Issue 3 — Dual token source, potential stale-token race~~ [DONE]

**Files:** `src/app/lib/roomAPI.ts`, `src/app/utils/context.ts`

**Problem:** `roomAPI.ts` calls `supabase.auth.getSession()` independently to get
the token. `getRequiredContext()` reads from the Zustand store. These can diverge
during a token refresh, causing a 401 on the next mutation.

**Fix:** `roomAPI.ts` functions should accept `token` as a parameter. `actionWrapper`
already provides the token via `getRequiredContext` — pass it through.

```ts
// roomAPI.ts — AFTER
export async function createRoomAPI(title: string, options: string[], token: string) {
  const res = await fetch("/api/room/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, options }),
  });
  ...
}

export async function joinRoomAPI(roomId: string, token: string) {
  const res = await fetch(`/api/room/${roomId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
  ...
}
```

Update callers to pass `token` from `getRequiredContext()` or `actionWrapper` context.

**Files to change:**
- `src/app/lib/roomAPI.ts` — remove internal `getSession()` calls; accept `token` param
- `src/app/store/room/useRoomStore.ts` — pass token from store/session into `createRoomAPI`/`joinRoomAPI`
- `src/app/hooks/useRoomLifeCycle.tsx` — verify call site still works after signature change

---

## ~~Issue 4 — AuthProvider race: redundant `getSession()` competes with `onAuthStateChange`~~ [DONE]

**File:** `src/app/Guard/AuthProvider.tsx`

**Problem:** `initializeAuth` calls `getSession()` and `onAuthStateChange` both set
session state. The `INITIAL_SESSION` event from `onAuthStateChange` fires first and
sets `loadingSession = false`. If that fires with a null session before `getSession()`
resolves, `AuthGuard` briefly sees `!loading && !user` and can trigger a redirect.

**Fix:** Remove the `initializeAuth`/`getSession()` block entirely. Per Supabase v2
docs, `onAuthStateChange` always fires `INITIAL_SESSION` synchronously on subscribe,
making the separate `getSession()` call redundant.

```ts
// AuthProvider — AFTER (simplified)
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setLoading('loadingSession', false);
    }
  );
  // set loading true until INITIAL_SESSION fires
  setLoading('loadingSession', true);
  return () => subscription.unsubscribe();
}, [setSession, setLoading]);
```

**Files to change:**
- `src/app/Guard/AuthProvider.tsx` — remove `initializeAuth`, keep only `onAuthStateChange`

---

## Issue 5 — `createServerClient` naming hides browser-side calls [LOW]

**File:** `src/app/lib/supabase.ts`

**Problem:** `createServerClient` is called from `services/options.ts` and
`services/votes.ts` which run in the browser. The name implies server-only use,
masking the fact that these are direct client-side Supabase calls outside the
API perimeter.

**Fix:** After Issue 2 is resolved, `createServerClient` will only be called from
API routes (genuinely server-side). No rename needed at that point — the misuse
is eliminated by fixing the callers. If any browser-side authenticated client is
still needed, name it `createAuthenticatedClient` and keep it clearly separate.

**Files to change:**
- `src/app/services/options.ts` — deleted or gutted after Issue 2 routes exist
- `src/app/services/votes.ts` — deleted or gutted after Issue 2 routes exist
- `src/app/lib/supabase.ts` — no rename needed once services are removed

---

## Execution order

| Step | Issue | Effort | Risk if skipped |
|---|---|---|---|
| ~~1~~ | ~~Fix join route body userId → `user.id`~~ | ~~Done~~ | ~~Active identity spoofing~~ |
| ~~2~~ | ~~Add POST/DELETE API routes for options + votes~~ | ~~Done~~ | ~~Auth perimeter incomplete~~ |
| ~~3~~ | ~~Remove internal `getSession()` from `roomAPI.ts`~~ | ~~Done~~ | ~~Stale token 401s on refresh~~ |
| ~~4~~ | ~~Remove redundant `getSession()` from AuthProvider~~ | ~~Done~~ | ~~Rare redirect race~~ |
| 5 | Clean up / delete `services/options.ts` and `services/votes.ts` | ~15 min | Dead code confusion |

Do steps 1 → 2 → 3 in a single session. Steps 4 and 5 can be a follow-up.

---

## ~~Scrutinize finding — dead `userId` params on createRoom / joinRoom~~ [DONE]

`useRoomStore.ts` `createRoom` and `joinRoom` still accepted `userId` as a parameter
after the refactor but never used it. Callers were still passing `user.id` into a black
hole. Removed from signatures, interface, and call sites.

---

## What is already correct (do not regress)

- `requireAuth` in all existing API routes — keep pattern
- Open redirect fix in `useAuth.ts:loginWithProvider` — URL origin validated
- `deleteOption` and `deleteVote` filter by `user_id` — preserve in new routes
- `Promise.allSettled` for realtime subscriptions — unrelated, keep as-is
