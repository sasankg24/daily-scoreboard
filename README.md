# Daily Scoreboard

One place for our friend group's daily games (Wordle, Connections, Daily Tens, Krillion), with
daily winners and monthly scoreboards. See `PLAN.md` for the plan and `LOG.md` for what changed.

**Live:** https://sasankg24.github.io/daily-scoreboard/

## How to use it
1. Tap a game to play it.
2. When you finish, tap the game's **Share** button and copy the result.
3. Pick your name, paste the result, and tap **Save result**.

The day view shows each game's winner and the day's winner. The month view shows the overall and
per-game standings; earlier months stay in the month menu.

## Run the tests
```
node --test
```
Parsers are tested with real share texts from our group chat; scoring is tested rule by rule
(R1 to R6 in `PLAN.md`).
