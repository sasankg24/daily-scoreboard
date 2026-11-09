# Daily Scoreboard

A site where a group of friends paste their daily game results (Wordle, Connections, Daily Tens,
Krillion) and see daily winners and monthly scoreboards. `PLAN.md` is the source of truth for
what to build, the scoring rules (R1 to R6), and who owns which piece. Read it first.

## Working on a team
- Several people, each with their own agent, work in this repository. Agents do not talk to
  each other, so `PLAN.md` and `LOG.md` are how you learn what the others are doing.
- Work only on the piece the person you are working with owns (see the owners table in
  `PLAN.md`), on that piece's branch. Never push to `main`.
- Never change the `Result` or `Standing` shapes in `PLAN.md` on your own. If a change seems
  needed, stop and say so.
- After a meaningful change, add a dated line to `LOG.md` saying what changed and why.

## Rules for the code
- Parsers and scoring are plain functions with no database or network access, so they can be
  tested with `node --test`.
- Every parser has tests built from real share text pasted by the friends, including a failed
  game.
- Scoring cites the rule it implements (for example `// R2: tied winners get 1 point each`).
- If a rule in `PLAN.md` is unclear or an open question affects your code, stop and ask rather
  than guessing.
