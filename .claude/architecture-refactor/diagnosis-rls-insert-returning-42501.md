# Diagnosis: guest `42501` joining a room (RLS enabled)

## Symptom
With RLS enabled, a guest joining a room failed:

```
POST /api/room/[roomId] → 500
Error joining room: {
  code: '42501',
  message: 'new row violates row-level security policy for table "room_members"'
}
```

The host was unaffected; hard refresh did not help; the guest was bounced home.

## Root cause (one sentence)
`supabase.from('room_members').insert(...).select(...)` compiles to `INSERT … RETURNING`,
and the **returned row is filtered through the table's SELECT policy
`is_member_of_room(room_id)` (a `SECURITY DEFINER` fn) within the same statement** — which
fails for a brand-new joiner and surfaces under the misleading "new row violates row-level
security policy" message that everyone reads as an INSERT/`with_check` failure.

The INSERT `with_check (auth.uid() = user_id)` was never the problem.

## The diagnosis path (and the false trails)

1. **Symptom:** RLS on → guest join → `42501 … room_members`. Host fine.
2. **First instinct (wrong, twice):** "it's RLS / `auth.uid()` / the new `sb_publishable_`
   signing keys." A prior note had "resolved" this — but only via a **GET**, whose `room`
   SELECT policy is literally `true` and never calls `auth.uid()`. It proved nothing about
   the failing INSERT path.
3. **Narrowed by request log:** the host's "successful" joins were hitting the
   *already-a-member early-return* in the join route — they never ran the INSERT. Only the
   guest ran a fresh INSERT. → insert-specific, not user-specific.
4. **Measured instead of guessed:** a temporary `public.debug_auth()` rpc printed what RLS
   actually sees at insert time:
   ```
   db_sees: { uid: '45e9…', role: 'authenticated', jwt_sub: '45e9…' }
   inserting_user_id: '45e9…'
   ```
   `auth.uid()` == role `authenticated` == the `user_id` being inserted. This **killed** the
   entire auth / signing-keys theory: `with_check (auth.uid() = user_id)` was provably `true`.
5. **Verified the policy was the real one:** dumped `pg_policies` for `room_members` — live
   policies matched the committed `RLS.json` exactly. No restrictive or creator-gated policy
   hiding. Only INSERT policy: `with_check (auth.uid() = user_id)`, PERMISSIVE, authenticated.
6. **Contradiction forces the real cause:** a `with_check` that is `true` cannot itself raise
   42501 ⇒ the error isn't from the INSERT check. The only other RLS surface in that statement
   is the `RETURNING` produced by the chained `.select()`, filtered by the **SELECT** policy.
7. **Isolated it:** split the statement —
   ```ts
   const { error } = await supabase.from('room_members').insert({ room_id, user_id }); // no .select
   // separate read-back
   const { data } = await supabase.from('room_members')
     .select('id, user_id, room_id, joined_at').eq('room_id', room_id).eq('user_id', user_id).single();
   ```
   Bare insert succeeded; standalone select-back returned the row. Fixed. Host never hit it
   because `create/route.ts` inserts the owner row **without** a chained `.select()`.

## Why it was hard to find
- **The error message lies about which policy.** "new row violates RLS policy" reads as an
  INSERT `with_check` failure; here it was the **SELECT** policy on the `RETURNING` clause.
- **Two decoys were partially corroborated** — the project really had migrated to new
  `sb_publishable_` keys, and RLS really had just been enabled, so the obvious story felt right.
- **Asymmetric symptom (host vs guest)** looked like a permission/identity difference, but the
  real difference was `.select()`-chained-on-insert (join route) vs not (create route) —
  invisible unless you diff the two call sites.
- **The check was true.** You can stare at `auth.uid() = user_id` forever. The bug is one layer
  over, in code nobody wrote as "a query" — it's implied by an ORM convenience method.

What broke the loop: **instrumenting the actual `auth.uid()` at the DB** instead of theorizing.
One measurement eliminated three hypotheses at once.

## The right pattern for a new project

**Rule:** when a table's SELECT policy depends on the row itself (membership/ownership), do not
chain `.select()` onto the insert. Insert, then read back as a separate statement.

```ts
// ❌ Trap: INSERT ... RETURNING, returned row filtered by the SELECT policy
//    (is_member_of_room / auth.uid() = created_by). 42501 for a fresh row.
const { data } = await supabase
  .from('room_members')
  .insert({ room_id, user_id })
  .select('id, user_id, room_id, joined_at')
  .single();

// ✅ Safe: write, then read back once the row exists and the SELECT policy passes
const { error: insertError } = await supabase
  .from('room_members')
  .insert({ room_id, user_id });
if (insertError) throw insertError;

const { data, error } = await supabase
  .from('room_members')
  .select('id, user_id, room_id, joined_at')
  .eq('room_id', room_id)
  .eq('user_id', user_id)
  .single();
```

Broader guidelines worth adopting from day one:
- **Design INSERT and SELECT policies together.** A row you may *create* but not yet *read back*
  in the same statement is the exact trap. Either keep the insert read-free, or make the SELECT
  policy satisfiable by the new row immediately.
- **Trusted server routes can use the service role for writes.** The API routes already
  authenticate the user (`requireAuth`) and set `user_id` server-side, so a `SUPABASE_SECRET_KEY`
  client for those writes sidesteps the whole RETURNING-under-RLS class while RLS still guards all
  direct client/realtime access.
- **Keep a `debug_auth()` helper in your dev toolbox.** One rpc returning
  `auth.uid() / auth.role() / auth.jwt()->>'sub'` collapses most "RLS is broken" debates in a
  single request. (Drop it when done: `drop function if exists public.debug_auth();`.)
