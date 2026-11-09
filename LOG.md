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
