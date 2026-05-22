### Lessons Learned — 2026-05-22

#### Security
- The three routes accepted caller-supplied identity (`userId` from request body/params) against the anonymous Supabase client — any unauthenticated request could join rooms or read vote results by spoofing a `userId`. The trust boundary was placed on the client instead of the server.
- The fix moves identity verification to the JWT layer: `Authorization: Bearer <token>` → `getServerUser(token)` → `supabase.auth.getUser()`. Only Supabase-issued tokens pass; identity is now server-verified, not caller-declared.
- **Rule**: every route touching user-scoped data gates on `getServerUser()` as the first statement inside `try {}`, before any param, body, or DB access.
- Residual surface: `POST /api/room/[roomId]` still accepts `userId` from the request body after auth passes. `user.id` from `getServerUser()` could replace it entirely, eliminating the spoofable param — left for a follow-up cleanup.

#### Architecture
- All routes imported the anon `supabase` client for both identity checks and DB queries. This made auth and data access structurally identical, so omitting the auth check had no obvious shape — it just looked like a shorter route.
- The fix makes the two-step pattern explicit: `getServerUser(token)` for identity, then anon `supabase` for queries. The separation is visible at the import level and inside the handler.
- If Supabase RLS is ever enabled, routes will need `createServerClient(token)` for DB queries in addition to identity checks — the current anon-query pattern will silently bypass RLS. Track this when adding RLS policies.
- `userId` in the `POST /api/room/[roomId]` body is now redundant (`user.id` is available from the auth result) — this is carried tech debt from before the auth gate existed.

#### Framework & Runtime Patterns
- **Routing**: `/api/option/[roomId]` parsed `roomId` by splitting `req.url.pathname` on `/`, which breaks under path prefixes, reverse proxies, or trailing slashes. The correct source for dynamic segment values in Next.js App Router is always the second handler argument `{ params }`, awaited as `const { roomId } = await params`. Never parse `req.url` to recover what the framework already resolved.
- **HTTP status codes**: `/api/vote/result` returned HTTP 200 with `{ error: 'Room id not found' }` on a missing param — a protocol violation where clients cannot detect failure without parsing the body. Fixed to HTTP 400. Rule: all error returns use the appropriate 4xx/5xx status; a 200 with an error body is never correct.