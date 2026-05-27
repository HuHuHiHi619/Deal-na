# INVARIANTS.md — Frozen Architectural Rules

> These rules are prescriptive and permanent.
> They must hold in the current architecture AND in any future rewrite.
> Do not relax, remove, or reword these without a recorded architectural decision.
> Last audited: fix/batch1-realtime-subscription-errors (2026-05-27).

---

## INV-1 — `requireAuth` on every API route

Every file under `src/app/api/` must call `requireAuth(req)` before any DB access. New routes (`/start`, `/members`, or any future route) are not exempt.

*Why it cannot be relaxed:* Supabase RLS is a defense-in-depth layer, not the primary auth boundary. A route without `requireAuth` exposes the service role key path.

---

## INV-2 — No browser-side Supabase writes for options or votes

`supabase.from('options').insert(...)` and `supabase.from('votes').insert(...)` must never appear in client code. All mutations go through `POST /api/option/...` and `POST /api/vote`.

*Why it cannot be relaxed:* Server routes apply `user_id = auth.uid()` filtering. Browser-side writes with the anon key bypass this and allow vote stuffing under a different user's ID if the RLS policy has a gap.

---

## INV-3 — Presence key must equal `userId` and must be bound before channel construction

The `config.presence.key` is set at `supabase.channel(name, { config: { presence: { key: userId } } })` call time. It cannot change without tearing down and rebuilding the channel.

*Why it cannot be relaxed:* Presence state is keyed by this value. Constructing the channel without it (or with an incorrect value) makes all presence state unreadable for this client.

---

## INV-4 — `channel.subscribe()` must resolve to `SUBSCRIBED` before any write whose echo is expected

Any `INSERT` or `UPDATE` that the client expects to receive as a realtime event must be issued **after** the channel is in `SUBSCRIBED` state.

*Why it cannot be relaxed:* Supabase Realtime does not buffer pre-subscription events. Events emitted before `SUBSCRIBED` are permanently lost. This is the root cause of RC-1 (self-member miss) in CURRENT_FLOW.md.

---

## INV-5 — Subscription failure must abort all channels atomically

If any channel fails to subscribe (`CHANNEL_ERROR` or `TIMED_OUT`), all channels in that session must be torn down before returning. Partial subscription (some channels live, some dead) must never persist.

*Why it cannot be relaxed:* Orphaned channels continue mutating stores while the UI shows an error (RC-4 in CURRENT_FLOW.md). This is a trust violation — the UI error state becomes a lie.

---

## INV-6 — Session guard must mirror actual channel state

The session guard (currently `subscribedRoomIdRef`, in the target architecture: provider `[roomId, userId]` effect deps) must be set only after all channels confirm `SUBSCRIBED` and cleared as the first action of teardown — not after it.

*Why it cannot be relaxed:* The guard is the only barrier against double-subscription. A stale `true` blocks recovery; a stale `undefined` after partial failure blocks retry.

---

## INV-7 — `currentRoom.started_at` must be a server value, never a client-invented timestamp

The field must be `null` until the host triggers start, at which point the server writes `NOW()` and the value arrives via realtime UPDATE. The client must not set it to any default.

*Why it cannot be relaxed:* Any non-null default makes every truthiness check on `started_at` immediately pass — which would fire the lobby navigation guard on every join. This is the root cause of RC-5 in CURRENT_FLOW.md.

---

## INV-8 — Store teardown must be total before a new room session begins

`currentRoom`, `votesMap`, `optionsMap`, `members`, `readyMembers`, `totalMembers` must all be cleared before `joinRoom` fires for a new room. localStorage persistence makes this especially important — a stale `currentRoom` from a previous session can survive a tab close.

*Why it cannot be relaxed:* Leftover state from room A is displayed as room B's data during the join latency window.

---

## Do Not Regress

These fixes have already shipped and must not be undone by any future change:

| Rule | Source |
|---|---|
| `requireAuth` pattern on all API routes | `src/app/api/` audit |
| Open redirect fix in `useAuth.ts:loginWithProvider` — URL origin validated before redirect | fix/batch1 |
| `deleteOption`/`deleteVote` filter by `user_id = user.id` server-side (not client-enforced) | fix/batch1 |
| `Promise.allSettled` for realtime subscriptions — do NOT replace with `Promise.all` | fix/batch1 |
| Dead service files `services/options.ts` and `services/votes.ts` deleted — do not recreate browser-side Supabase calls for option/vote writes | fix/batch1 |
| `UiKey` union type on `useUiStore` setters | fix/batch2 |
| `useRoomForm` Zustand store deleted — form state lives in React context | fix/batch3 |
| `activeChannel` module-level vars replace channel objects stored in Zustand state | fix/batch1 |

---

## Unsafe Frontend Assumptions (currently violated)

These are known violations of the invariants above, present in the current codebase, targeted for the restructure:

| Assumption | Why it is unsafe | Violates |
|---|---|---|
| `currentRoom.started_at` is a real server timestamp | Hardcoded to `now + 24h` in `joinRoom`; DB value never read | INV-7 |
| `members` starts empty and grows to full count via events | No initial fetch; pre-existing members invisible | INV-4 (join before subscribe) |
| `fetchVote()` result is always the latest | No stale-resolution guard; last-to-resolve wins | — (RC-3) |
| Realtime INSERT means the entity does not already exist locally | True for `votesMap` (Map dedup), but `voteResults` can flicker | — (RC-2) |
| Partial subscription failure leaves stores clean | Three surviving channels continue mutating stores | INV-5 |
| Presence `sync` event fires immediately and reflects all current members | Supabase Presence convergence is eventual; initial `sync` may be empty or partial | INV-3 (timing) |
