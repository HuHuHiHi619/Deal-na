# SUPABASE.md
> Supabase schema, RLS policies, and client setup for Deal Na.

## Client Setup (`src/app/lib/supabase.ts`)

| Export | Usage |
|---|---|
| `supabase` | Public anon client — used client-side for auth, realtime |
| `createServerClient(token)` | Server-side client — passes `Authorization: Bearer <token>` header; used in all API routes |
| `requireAuth(req)` | API route middleware — extracts bearer token, verifies via `auth.getUser(token)`, returns `{ user, supabase }` or 401 |

**Pattern:** API routes call `requireAuth(req)` first. All subsequent DB queries use the returned `supabase` (authenticated client) so RLS policies apply with the caller's identity.

---

## Tables

### `public.room`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `room_code` | `varchar` UNIQUE | Short join code |
| `title` | `text` | Room topic |
| `created_by` | `uuid` FK → `auth.users.id` | Host user |
| `created_at` | `timestamptz` | Default `now()` |
| `expired_at` | `timestamptz` | Optional expiry |
| `started_at` | `timestamp` | `null` until Host starts; triggers Vote Session |

### `public.room_members`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `room_id` | `uuid` FK → `room.id` | |
| `user_id` | `uuid` FK → `auth.users.id` | |
| `joined_at` | `timestamptz` | Default `now()` |

### `public.options`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `room_id` | `uuid` FK → `room.id` | |
| `user_id` | `uuid` FK → `auth.users.id` | Creator of the option |
| `title` | `text` | Option text |
| `created_at` | `timestamptz` | Default `now()` |

### `public.votes`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `room_id` | `uuid` FK → `room.id` | |
| `option_id` | `uuid` FK → `options.id` | |
| `user_id` | `uuid` FK → `auth.users.id` | Voter |
| `created_at` | `timestamptz` | Default `now()` |

---

## RLS Policies

RLS is enabled on all four tables. All policies are `PERMISSIVE`.

The helper function `is_member_of_room(room_id)` gates read access on options, votes, and room_members — only members of the room can see its data.

### `room`

| Policy | Cmd | Who | Condition |
|---|---|---|---|
| `authenticated can create rooms` | INSERT | `authenticated` | always (`true`) |
| `authenticated can read rooms` | SELECT | `authenticated` | always (`true`) |
| `Host can update room` | UPDATE | `public` | `auth.uid() = created_by` |
| `only creator can delete room` | DELETE | `authenticated` | `auth.uid() = created_by` |

### `room_members`

| Policy | Cmd | Who | Condition |
|---|---|---|---|
| `users can join rooms` | INSERT | `authenticated` | `auth.uid() = user_id` |
| `room_members_select_v2` | SELECT | `public` | `is_member_of_room(room_id)` |
| `users can leave rooms` | DELETE | `authenticated` | `auth.uid() = user_id` |

### `options`

| Policy | Cmd | Who | Condition |
|---|---|---|---|
| `room members can create options` | INSERT | `public` | `auth.uid() = user_id AND is_member_of_room(room_id)` |
| `room members can view options` | SELECT | `public` | `is_member_of_room(room_id)` |
| `users can delete own options` | DELETE | `authenticated` | `auth.uid() = user_id` |

### `votes`

| Policy | Cmd | Who | Condition |
|---|---|---|---|
| `room members can vote` | INSERT | `public` | `auth.uid() = user_id AND is_member_of_room(room_id)` |
| `room members can view votes` | SELECT | `public` | `is_member_of_room(room_id)` |
| `users can delete own votes` | DELETE | `authenticated` | `auth.uid() = user_id` |

---

## Key Notes

**`is_member_of_room(room_id)`** — Postgres function (not in schema dump). Used as a guard on SELECT/INSERT for options, votes, and room_members. A user must have a row in `room_members` for a room before they can read its options or votes.

**No UPDATE on `votes` or `options`** — edits are not supported by RLS. Changing a vote requires DELETE + INSERT.

**`started_at` is the Vote Session trigger** — the frontend watches for a non-null `started_at` via realtime `room` UPDATE events to navigate from Lobby to Vote Session. It is `timestamp` (no timezone), set only by the Host via `POST /api/room/[roomId]/start`.

**Votes are not unique-constrained per user/option** — the 3-vote budget is enforced client-side only (via `useVoteStats`). The DB allows multiple votes from the same user to the same option.
