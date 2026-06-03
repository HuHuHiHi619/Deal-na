# App Flow: Voting App with Realtime Sync

## Glossary (add from this flow)
- **CreatePage** : create topic and options  
- **Lobby**: waiting room before start vote (host 1/1, user 1/2)
- **Vote Session**: while voting user cannot see each other
- **Locked State**: after ready user can see other status not a vote and their cannot change vote 
- **Result State**: summarize , another round / vote again when tie

## User Stories

### Story 1: Host creates room
1. Host enter topic press confirm topic -> show options input enter options (at least 1) → create room 
2. Host to lobby + auto join room
3. Lobby show : link, QR, member list (such as "1/1" = only host)
4. User join via link/QR 

### Story 2: Start voting
- **Precondition**: all member is inside lobby already (count = expected)
- Host press "Start Voting" → everyone navigate to vote

### Story 3: Voting
- everyone has 3 votes (free , cannot see other focus on your decision)
- button +/- change votes
- press "Ready" → to locked state

### Story 4: Locked state
- show : "You locked vote"
- show list: who ready / not ready
- **Trigger**: when everyone ready → navigate to result instantly

### Story 5: Result & Another Round
- show ranking votes (desc)
- **If tie**: show "Vote Again" button → back to vote page
- **Else**: show "Another Round" button → new game (reset all)

### Story 6: Improvement 
- **CreateRoom** : Is there actions for create room too much? maybe there is better flow
- **Lobby** : There is any options better for joiner. QR CODE is good just scan but link is hard. host have to copied link and paste to  joiner chat  


## State Transitions (Critical for Realtime)
Lobby → VoteSession → LockedState → Result
     ↑                                      |
     └──────── Another Round ──────────────┘

## Expected Realtime Behavior
- Lobby: member list, ready status 
- VoteSession: own votes  
- LockedState: everyone ready status 
- Result: final votes (aggregate)



