# Deal Na

Deal Na is a real-time group voting app: a Host opens a Room around one topic, friends join via link or QR, everyone spends a fixed budget of votes, and the Room resolves to a ranked Result.

This file is a glossary of the project's domain language and nothing else. Implementation details (realtime mechanics, presence payloads, providers) live in `CLAUDE.md`; flow and state transitions live in `FLOW.md`.

## Language

**Room**:
A voting session scoped to a single topic. Progresses through states: Lobby → Vote Session → Result. Has one Host and zero or more Guests.
_Avoid_: session, game, poll

**Host**:
The Member who created the Room. The only Member who can start the Vote Session and initiate Another Round.
_Avoid_: owner, creator, admin

**Guest**:
A Member who joined a Room via link or QR code. Cannot start the Vote Session.
_Avoid_: participant, joiner, attendee

**Member**:
Any authenticated user in a Room, including the Host. Identified by their `userId`.
_Avoid_: player, voter

**Lobby**:
The pre-voting waiting room. Members gather here after joining; the Host starts the Vote Session once enough have arrived. There is no per-member ready gate. Starting requires at least 2 Members (a solo Room can never resolve a Result).
_Avoid_: waiting room, staging

**Vote Session**:
The phase when voting is active. Members cannot see each other's votes. Each Member spends their Vote Budget across the Options.
_Avoid_: voting round, poll phase

**Locked State**:
A UI mode within the Vote Session, not a separate page. A Member enters it after pressing Ready: their votes are frozen and they see who else is ready.
_Avoid_: submitted, finalized

**Result**:
The final phase after every Member is locked in. Shows Options ranked by Vote count. A top tie lets the Host start Another Round.
_Avoid_: outcome, summary, leaderboard

**Option**:
A choice Members vote on within a Room. Created by the Host at Room creation time.
_Avoid_: choice, candidate, answer

**Vote**:
One vote unit allocated from a Member to an Option.
_Avoid_: point, pick, ballot

**Vote Budget**:
The fixed number of Votes a Member may cast in a Vote Session, split freely across Options. Currently 3.
_Avoid_: allowance, credits

**Ready**:
The state a Member enters by locking in their Votes during the Vote Session. When every Member is Ready, the Room advances to Result automatically. (The Lobby has no Ready step.)
_Avoid_: done, confirmed, submitted

**Presence**:
Who is live in a Room right now. Ephemeral membership state — it does not persist and drives the Lobby's "N friends joined" view and the Locked-State readiness list.
_Avoid_: online status, connection

**Another Round**:
A fresh Vote Session in the same Room, started by the Host when a Result ties. Resets Votes but keeps the same Members and Options.
_Avoid_: rematch, replay, restart

## Example dialogue

> **Dev:** When a Guest joins, do they count toward the "start voting" minimum?
> **Domain expert:** Yes. The Host plus one Guest is two Members — that's the minimum. The Host eyeballs Presence in the Lobby; there's no ready gate there.
> **Dev:** And once they're in the Vote Session, "Ready" means they're done?
> **Domain expert:** Right — Ready freezes their Votes and drops them into Locked State. When the last Member goes Ready, the Room flips to Result on its own.
> **Dev:** If two Options tie at the top of the Result?
> **Domain expert:** Only the Host can start Another Round — same Members, same Options, Votes reset.
