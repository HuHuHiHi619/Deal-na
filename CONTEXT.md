# CONTEXT.md
> Domain glossary for Deal Na. Implementation details belong in CLAUDE.md / FRONTEND.md, not here.

## Terms

### Room
A voting session scoped to a single topic. A Room has one Host and zero or more Guests. A Room progresses through states: Lobby → Vote Session → Result.

### Host
The member who created the Room. The Host is the only member who can start the Vote Session.

### Guest
Any member who joins a Room via link or QR code. Guests cannot start the Vote Session.

### Member
Any authenticated user participating in a Room, including the Host. A Member's identity is their `userId`.

### Lobby
The pre-voting waiting room. Members gather here after joining. The Host sees all connected Members and controls when to start.

### Vote Session
The phase when voting is active. Members cannot see each other's votes. Each Member has a fixed vote budget (3 votes, free allocation across options).

### Locked State
The state a Member enters after pressing Ready. They can no longer change their votes. They see a readiness list showing who is ready and who is not. The Member is still in the Vote Session page — Locked State is not a separate page, it is a UI mode within it.

### Result
The final phase after all Members are locked in. Shows a ranked list of options by vote count. If there is a tie at the top, the Host may initiate another round.

### Option
A choice that Members vote on within a Room. Options are created by the Host at Room creation time.

### Vote
A single allocation of one vote unit from a Member to an Option. A Member may cast up to 3 votes total, split freely across Options.

### Ready
A Member state with two distinct phases, both tracked via Supabase Presence (not persisted to DB):
- **Lobby-ready** (`status`): pressed "I'm Ready" in the Lobby; gates the Host's Start button.
- **Vote-locked** (`locked`): pressed "Lock In My Votes" in the Vote Session; when all Members are locked, the session advances to Result automatically.

These are separate presence booleans so that lobby-readiness never leaks into the Vote Session — the Lobby and Vote Session share one RoomSessionProvider across the soft-navigation, so a single shared flag would carry over.

### Presence
The real-time membership state of the Supabase channel. Per Member it tracks `{ user_id, name, status (lobby-ready), locked (vote-locked) }`. Presence is ephemeral — it does not persist to the database, and is not subject to RLS.

### Reconnect Recovery
The behavior when a Member's WebSocket connection drops and re-establishes. The app re-fetches all state slices and re-tracks the Member's Presence with their last known Ready state.

### Vote Budget
The total number of votes a Member may cast in a Vote Session. Currently fixed at 3.

### Another Round
A new Vote Session within the same Room, initiated when the Result is a tie. Resets votes but keeps the same Members and Options.