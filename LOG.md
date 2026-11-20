# Log

Plans and changes, newest at the bottom. Anyone (or their agent) can add entries.

## 2026-11-08
- Picked the project: one place for our friend group's daily games, with daily winners and
  monthly scoreboards. Built for the friends who play them, not for us.
- Got the scoring rules from the group: solo win 2 points, tied winners 1 point each, a missed
  day is a loss, daily winner = most points that day, monthly reset, past months kept.
- Learned that Snapchat can't be read by outside apps, so results come from pasted share text.
- Wrote `PLAN.md`, `CLAUDE.md` and this log (drafted with Claude). Still looking for a teammate.
- Got real Daily Tens and Krillion share texts from the group chat and added their formats to
  PLAN.md. Puzzle numbers decide the day, so late pastes still count for the right day.
- Open: daily and monthly tiebreakers (see PLAN.md).

## 2026-11-08 (evening): first working version
- Still no teammate, so I built the first version myself with Claude so there is something to
  hand over tonight. The owners table still has scoring and site open for a teammate.
- Built: links to all four games, a paste box, parsers for all four games, scoring for R1 to R6,
  a day view, monthly standings (overall and per game), past months, and export/import backup.
  18 tests (`node --test`), all passing. Tested in a phone-sized browser with real shares.
- A test caught that the Daily Tens example has 7 trophies, not the 6 I first counted.
- Changed from the plan, for tonight only:
  - Results are saved in one browser (localStorage), not a shared database. One person enters
    everyone's shares from the group chat. A shared database so each friend can submit their own
    is the next step.
  - The day is picked when a result is entered (defaults to today), instead of being worked out
    from the puzzle number.
- Decisions the rules didn't cover: a failed game can't win (if everyone fails, nobody gets
  points); people tied for the most points in a day are all shown as day winners until the group
  decides (Q1); monthly standings break ties by game wins, then name, but tied leaders are all
  shown as winners (Q2).

## 2026-11-15: Artifact 5 (moonshot) starts
- Chose to continue the Daily Scoreboard as my Artifact 5 moonshot, working solo.
- Wrote `docs/moonshot-plan.md` (drafted with Claude): the v2 goal (each friend submits from
  their own phone to a shared, deployed scoreboard, plus AI screenshot reading), five weekly
  milestones, open decisions (backend, identity, AI model) and risks.
- Next (Week 2): pick the backend, move results into a shared database, deploy, and get two
  friends submitting from their own phones.

## 2026-11-18: Week 2, shared data
- Picked Firebase for the backend (I used it before for BrandBridge): a new project
  `daily-scoreboard` with anonymous sign-in and a Firestore database, Analytics and Gemini off.
- Each phone now signs in anonymously, picks its name once, and submits its own results. The
  scoreboard reads live from the database, so every phone sees the same thing without reloading.
- Security: `firestore.rules` (published in the console, copy in the repo). Anyone signed in can
  read; a phone can only write its own name and its own results, in exactly the expected shape.
  I tried six ways to break it from the browser (writing as someone else, renaming someone,
  extra fields, a wrong document id, an unknown game, deleting a player) and all were refused.
- Tested with two separate browsers as two phones: the second saw the first one's results and
  updated live when a new one was posted, and could not remove the first one's results.
- New `src/records.js` (data shapes) with 6 tests; 24 tests pass. The local-only import was
  removed, since everyone now writes their own results. Drafted with Claude.
- Open: anyone with the link can join for now; a group join code is planned for Week 3. The day is
  still picked when a result is entered, not taken from the puzzle number.
- Next: send the link to the group and get two friends submitting from their own phones.

## 2026-11-19: first real use
- Sent the link to the group. Three players joined from their own phones (me and two friends)
  and posted 6 results across all four games on the first day. Week 2 milestone met.
- Built name-and-password accounts (same name on any device) on the `accounts` branch, but held
  it back so friends could try the current version first. To switch over: test it, publish the
  stricter rules, merge, and turn off anonymous sign-in.

## 2026-11-20: name-and-password accounts go live
- Switched from phone-only anonymous sign-in to accounts: a name and a password that work on
  any device. Firebase password sign-in needs an email, so each name maps to a private login
  address (`<name>@users.daily-scoreboard.app`); nobody types it or gets mail there.
- Rules now require a password account, and a player's name must match its own login, so nobody
  can post under someone else's name. Tested from the browser: my own result and my own name were
  allowed; renaming myself to an existing friend's name, posting for another account, extra
  fields, an unknown game, deleting a player, and deleting a friend's result were all refused.
- Found and fixed before release: a phone still signed in the old anonymous way stalled on
  "Connecting". Old anonymous sign-ins are now signed out so the sign-in screen shows.
- Results already posted stay on the scoreboard and still score under the same name once a friend
  makes an account with that name. Duplicate names from the switch are listed once.
- Tested end to end with a throwaway account (create, post, sign out, wrong password, sign back
  in, short password, taken name), then deleted it. 27 tests pass.
- Firebase showed 18 anonymous visitors over two days, against 3 who posted. Worth asking the
  group what stopped the others.
