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

## Issue 2 — Direct Supabase writes bypass server auth perimeter [HIGH]

**Problem:** `createOption`, `deleteOption`, `createVote`, `deleteVote` all call
`createServerClient(token)` directly from the browser. They skip Next.js API routes,
so no server-side validation, rate limiting, or application-layer enforcement exists
for any write to `options` or `votes`.

**Fix:** Add four new API routes and route all mutations through them.

### 2a — `POST /api/option/[roomId]`
- Handler: `requireAuth` → insert into `options` using `user.id` (not body userId)
- Remove direct call in `useOptionStore.createOption`
- Delete `createOption` from `services/options.ts` (or leave as dead code to remove later)

### 2b — `DELETE /api/option/[optionId]`
- Handler: `requireAuth` → delete where `id = optionId AND user_id = user.id`
- The `user_id` filter enforces ownership server-side — body `userId` not trusted
- Update `useOptionStore.deleteOption` to call this route

### 2c — `POST /api/vote`
- Body: `{ roomId, optionId }`
- Handler: `requireAuth` → insert `{ room_id, option_id, user_id: user.id }`
- Update `useVoteStore.createVote` to call this route

### 2d — `DELETE /api/vote`
- Body or query: `{ roomId, optionId }`
- Handler: `requireAuth` → delete where `room_id = roomId AND option_id = optionId AND user_id = user.id`
- Update `useVoteStore.deleteVote` to call this route

**Files to change:**
- `src/app/api/option/[roomId]/route.ts` — add `POST` handler
- `src/app/api/option/[optionId]/route.ts` — new file, `DELETE` handler
- `src/app/api/vote/route.ts` — new file, `POST` + `DELETE` handlers
- `src/app/store/option/useOptionStore.ts` — `createOption`, `deleteOption` call API routes
- `src/app/store/vote/useVoteStore.ts` — `createVote`, `deleteVote` call API routes
- `src/app/services/options.ts` — `createOption`, `deleteOption` can be removed
- `src/app/services/votes.ts` — `createVote`, `deleteVote` can be removed

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
| 2 | Add POST/DELETE API routes for options + votes | ~2 hrs | Auth perimeter incomplete |
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
