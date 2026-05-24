# Auth System Fix Plan

> Generated from auth system analysis + scrutinize review.
> Gaps 4 (edge middleware) and 7 (session persistence) were dropped — see notes below.

---

## Priority order

| # | Gap | Category | Depends on | Status |
|---|---|---|---|---|
| 1 | Open redirect in OAuth `redirectTo` | Security | — | |
| 2 | `loadingSession` fragility | Bug (latent) | — | |
| 3 | `TestUserLoginButton` quick-test buttons redirect to login page | Bug | — | |
| 4 | Duplicated API auth boilerplate | Maintenance | — | ✅ done |
| 5 | Redundant `setUser` alongside `setSession` | Cleanup | fix 2 (same file) | ✅ done |

---

## Gap 1 — Open redirect in OAuth `redirectTo`

**Root cause:** `loginWithProvider` reads the raw `?redirect` query param and passes it into Supabase's `redirectTo` without validating it is a same-origin relative path.

**Real attack vector:** `?redirect=//evil.com` produces `https://app.com//evil.com`; browsers may normalize this to `https://evil.com`. Absolute URLs like `https://evil.com` are not exploitable because `window.location.origin` is always prepended (result is a broken path, not a redirect). Supabase's dashboard redirect-URL allowlist is the primary defense — verify it is tight.

**Fix approach:** Before using the `redirectPath` value, assert it starts with `/` and contains no `://` or `//`. If validation fails, fall back to `/room`.

**Files:** `store/auth/useAuth.ts` — `loginWithProvider`, around line 73.

**Depends on:** nothing.

---

## Gap 2 — `loadingSession` fragility

**Root cause:** `AuthProvider` never explicitly sets `loadingSession: true` before its async session check — it relies on `useUiStore`'s hardcoded initial value of `true`. `useUiStore.clearAll()` resets `loading: {}`, silently dropping `loadingSession`; if called (e.g., during logout cleanup), `AuthGuard` sees `loadingSession === undefined` (falsy), immediately evaluates `!user`, and flashes a redirect before the session recheck resolves.

**Fix approach:** At the top of `initializeAuth`, before the `getSession` call, explicitly call `setLoading("loadingSession", true)`. Makes the provider self-contained and independent of store initial state.

**Files:** `Guard/AuthProvider.tsx` — top of `initializeAuth`.

**Depends on:** nothing.

---

## Gap 3 — `TestUserLoginButton` quick-test buttons redirect to login page

**Root cause:** The quick-test preset buttons (dev-only block) call `window.location.href = "/"` on success, sending the user back to the login page instead of `/room`. The main email form (`handleEmailLogin`) already redirects to `/room` correctly — only the quick-test block is wrong.

**Fix approach:** Change `window.location.href = "/"` to `window.location.href = "/room"` inside the quick-test buttons block. Scope the fix there only; the main form is correct.

**Files:** `component/button/TestUserLoginButton.tsx` — line 89.

**Depends on:** nothing.

---

## Gap 4 — Duplicated API auth boilerplate ✅

---

## Gap 5 — Redundant `setUser` alongside `setSession` ✅

---

## Dropped gaps

### Edge middleware (original gap 4)
**Why dropped:** The project uses `@supabase/supabase-js` (browser client), which stores session tokens in localStorage. Next.js middleware runs server/edge-side and has no access to localStorage — it can only read cookies. Adding middleware as described would silently treat every request as unauthenticated. Making this work requires first migrating to `@supabase/ssr` with cookie-based session storage, which is a separate effort with its own risk surface. Defer until that migration is planned.

### Session persistence (original gap 7)
**Why dropped:** `supabase.auth.getSession()` reads from Supabase's own localStorage cache synchronously — no network call is made on a warm session. The visible flash comes from React's hydration cycle (`useEffect` fires after first paint), not from async latency. Persisting `user` in a second Zustand store doesn't fix this and introduces a stale-state regression: a user with an expired session would see their old `user` object until `getSession` overrides it. If the flash is worth addressing, the correct fix is a persistent loading skeleton in `layout.tsx` — no store changes needed.
