# Auth System Fix Plan

> Generated from auth system analysis + scrutinize review.
> Gaps 1 2 3 5 6 was done.
> Gaps 4 (edge middleware) and 7 (session persistence) were dropped — see notes below.

---

## Dropped gaps

### Edge middleware (original gap 4)
**Why dropped:** The project uses `@supabase/supabase-js` (browser client), which stores session tokens in localStorage. Next.js middleware runs server/edge-side and has no access to localStorage — it can only read cookies. Adding middleware as described would silently treat every request as unauthenticated. Making this work requires first migrating to `@supabase/ssr` with cookie-based session storage, which is a separate effort with its own risk surface. Defer until that migration is planned.

### Session persistence (original gap 7)
**Why dropped:** `supabase.auth.getSession()` reads from Supabase's own localStorage cache synchronously — no network call is made on a warm session. The visible flash comes from React's hydration cycle (`useEffect` fires after first paint), not from async latency. Persisting `user` in a second Zustand store doesn't fix this and introduces a stale-state regression: a user with an expired session would see their old `user` object until `getSession` overrides it. If the flash is worth addressing, the correct fix is a persistent loading skeleton in `layout.tsx` — no store changes needed.
