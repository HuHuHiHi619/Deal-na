# Learning Guide — Gift Reveal on the Results Page

A walkthrough of how this feature was designed, scrutinized, built, and debugged.
Written as a reusable playbook, not just a changelog. Read it as "how to run a
feature like this next time," with this session as the worked example.

---

## 0. TL;DR of what shipped

A full-screen "gift reveal" on the results page: a dark, blurred backdrop drops
instantly, the winner card pops in (reward-popup style), holds ~2.5s, then fades
out to reveal the normal results page. Tap to skip. Plays once per room. Skipped
entirely under `prefers-reduced-motion`.

Files: `component/vote/WinnerReveal.tsx` (+ test), `room/[roomId]/result/page.tsx`
(gating), `theme.css` (`.bg-scrim`), `globals.css` (keyframes), `lib/motion.ts`.

---

## 1. Pick the right tool before you start

The session opened with a tooling confusion worth internalizing.

| Tool | Use it when… | Writes to |
|------|--------------|-----------|
| `grill-with-docs` | The feature introduces or sharpens **domain language** (a new Room state, a "Spectator" role) | `CONTEXT.md` glossary, ADRs |
| `grill-me` | **UI / animation / refactor** with no new vocabulary | nothing — just sharpens the plan |
| `scrutinize` | You have a plan/diff and want it challenged for *necessity* + *correctness* | nothing |
| `diagnose` | A bug with an unknown cause; you need a disciplined hunt | a fix + regression test |

**Lesson:** an animation feature has *zero* domain terms, so `grill-with-docs`
would have produced an empty glossary diff. `grill-me` was correct. Choose the
tool by *what the change touches*, not by what sounds thorough.

### CONTEXT.md is a glossary and nothing else
- Root `CONTEXT.md` is already the right filename/location for a single-context repo.
- Format: flat `## Language` list, `**Term**: one-line def`, `_Avoid_: aliases`.
- **No implementation details.** Mechanics (presence payloads, providers, reconnect)
  belong in `CLAUDE.md`; concepts stay as one-liners. We moved them out.
- Drop dead docs (things nothing reads) — stale docs mislead future readers/AI.

---

## 2. Grill the design before touching code

`grill-me` resolves the decision tree one branch at a time, each with a recommended
answer. The branches that mattered here (and the general questions behind them):

1. **What motion, exactly?** ("Confetti? card reveal? bars?") — scope the change.
2. **Trigger & replay safety** — *when* does it fire, and how do you stop it
   replaying on re-render / reconnect / late data?
3. **Edge states** — what does a *tie* do? what about all-zero votes?
4. **Mechanism** — CSS keyframes vs a library (don't add deps for one screen).
5. **Accessibility** — honor `prefers-reduced-motion`.

**Lesson:** the highest-value grill questions are about *timing and edge states*,
not aesthetics. "When does it fire and how do you guarantee once?" caught the real
complexity early.

---

## 3. Scrutinize: question the model, not just the lines

Before building, `scrutinize` traced the plan against real code and found the plan
was built on a **wrong mental model** — the single most valuable kind of finding.

- The plan added a "clear the once-flag when a new round starts in the same room."
- **Reality (`AnotherRoundButton.tsx`):** "Another Round" calls `router.push("/room")`
  — it creates a **brand-new room with a new `roomId`**. There is no same-room
  re-vote. So a flag keyed by `roomId` *already* differs next round → replays for
  free. The entire reset mechanism was dead complexity.
- This also surfaced a **doc/reality drift**: `CONTEXT.md`/`FLOW.md` say Another
  Round is "a fresh Vote Session in the **same** Room," but the code makes a new room.

Other scrutiny wins:
- A premise I had *grilled the user on* ("a reconnect remounts the page") was
  **false** — reconnect re-subscribes a Supabase channel, it doesn't navigate.
  Always verify the premise behind a question, not just the answer.
- "Defer the confetti" — the fiddliest, easiest-to-look-cheap part was cut from v1
  to de-risk (90% of the payoff, 10% of the risk).

**Lesson:** before implementing, trace the *load-bearing assumptions* to real code.
A wrong model deletes more work than any line-level nit.

---

## 4. The two bugs (diagnose discipline)

### Bug A — "no animation, just plain results"
The cause was never the component. The **feedback loop** proved it: a 4-test
Vitest harness rendered `WinnerReveal` in isolation and showed it mounts, shows,
and dismisses correctly. That moved the fault to the **gating**, which had three
silent early-returns:
1. results not ready,
2. `prefersReducedMotion()` true (Windows "Animation effects" off → this fires!),
3. sessionStorage flag already set (re-testing the same room).

Tagged instrumentation (`[DEBUG-gift]`) on each branch made the cause observable
in the browser console.

**Lesson:** when a thing "doesn't show," first prove the thing *can* show in
isolation, then the bug is in the *decision to show it*, not the rendering. And
remember real-world environment state: OS reduced-motion + sticky sessionStorage
are classic "works on a fresh machine, not on the tester's" traps.

### Bug B — "I see results before the winner / through the overlay"
Two compounding causes, both architectural:
1. **Flash before reveal:** the decision lived in `useEffect`, which runs *after*
   React commits and the browser paints → one guaranteed frame of bare results.
   **Fix:** decide **synchronously during render** so the overlay lands in the
   same commit as the results.
2. **See-through:** scrim was ink @70% *and* faded in over 450ms (semi-transparent
   for half a second). **Fix:** ink @92%, stronger blur, and **drop the fade-in**
   (dark covers instantly; the card pop is the "gift"; keep the fade-*out*).

**Lesson — the React timing rule:** `useEffect` is *after paint*. If a decision
must be visible on the first frame (gating an overlay, preventing a flash), make
it during render, not in an effect. Keep *side effects* (writing sessionStorage)
in the effect; keep the *decision* in render.

---

## 5. Reusable patterns from this feature

### Play-once that survives reconnect but replays on a real new round
```
key = `dealna:gift-shown:${roomId}`   // roomId is the natural round identity here
```
- In-memory ref → replays on remount (reload). sessionStorage → survives reload.
- Keyed by `roomId`, so a new room (Another Round) replays automatically.
- Set the flag **at show-time**, not on completion → a refresh mid-reveal won't replay.

### prefers-reduced-motion, two layers
- JS gate (`lib/motion.ts → prefersReducedMotion()`): skip the whole overlay.
- CSS belt-and-suspenders: `@media (prefers-reduced-motion: reduce)` disables the
  keyframes too.

### Design-token discipline (this repo)
- Never hardcode color/radius/shadow/font-size in components. Add to `theme.css`
  first (`.bg-scrim` via `color-mix` on `--color-ink`), then use the utility class.
- Keyframes/raw rgba live in `globals.css` (CSS layer), never in `className`.

### Skip-with-timer seam (bug-prone)
A phase machine (`hold → leaving`) with a `setTimeout` *and* a tap-to-skip must
**clear the pending timer on skip**, or `onDone` can double-fire. Watch these seams.

---

## 6. Testing notes specific to this repo
- This was the repo's **first** test file. Vitest runs with `globals: true`, but
  `tsc`/`next build` didn't know the globals → added `"types": ["node","vitest/globals"]`
  to `tsconfig.json` (kept `node` so `process.env`/timers stay typed).
- jsdom doesn't run CSS transitions, so `transitionend` never fires on its own —
  fire it manually with `fireEvent.transitionEnd(el)` to test `onDone`.
- Honest limit: the **page-level flash fix has no clean test seam** (needs query
  mocks + paint-order timing jsdom can't model). That absence is itself a finding,
  not something to paper over with a test that passes while skipping the real path.

---

## 7. Process habits worth keeping
- **Confirm, don't assume, scope:** "discard which changes?" separated the animation
  revert from the (good) docs work.
- **Don't claim a UI screen "done" without a screenshot** (RE-DESIGN.md rule). Tests
  prove logic; only your eyes prove "looks like a gift."
- **Surface things you didn't do:** `SUPABASE.md` showed as deleted but wasn't mine —
  flagged every time rather than sweeping it into a commit.
- **Never commit/push without approval** (CLAUDE.md). Everything above is staged in
  the working tree on `feat/result-animation`, uncommitted.
```
