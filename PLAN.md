# Daily Scoreboard: Plan

TCSS 490, Artifact 4: For Someone Else. Built for my friend group, who play the same daily
games and currently share results over Snapchat.

## What it does

One place for our daily games. Each person plays a game, taps the game's **Share** button, and
pastes the result into the site. The site reads the score from the pasted text, picks each day's
winners, and keeps monthly scoreboards.

Snapchat has no way for outside apps to read chats, so scores come from pasted share text, not
from Snapchat.

## Games

| Game | Best result | Read from the share text |
|---|---|---|
| Wordle | fewest guesses (X = failed) | `Wordle 1,234 3/6` |
| Connections | fewest mistakes | count of mixed-color rows |
| Daily Tens | most right | TODO: need a sample share text |
| Krillion | highest score | TODO: need a sample share text |

More games can be added later. Each game is one parser and one "which result is best" rule.

## Scoring rules (from the friend group)

- R1. Each game, each day: the best result wins.
- R2. One winner gets **2 points**. If several people tie for best, each gets **1 point**.
- R3. A player who doesn't submit a game that day automatically loses it (0 points).
- R4. The **daily winner** is the person with the most points that day, across all games.
  Each game also has its own daily winner.
- R5. Points reset on the 1st of every month. The monthly winner is overall (most points) and
  per game (most points in that game).
- R6. Earlier months stay viewable, with their final standings and winners.

### Open questions for the friends
- Q1. If two people tie for most points in a day, are they both daily winners?
- Q2. If two people tie for the month, is there a tiebreaker (e.g. most games won)?
- Q3. Which day does a result count for if it's pasted after midnight?

## Pieces and owners

| Piece | What it is | Owner |
|---|---|---|
| Parsers | one function per game: share text in, `{game, puzzle, result}` out, with tests | Sasank |
| Scoring | daily points (R1 to R4), monthly totals and winners (R5, R6), with tests | TBD (teammate) |
| Site | paste box, today's results, monthly and per-game scoreboards, past months | TBD |

The pieces meet in two shapes, which nobody changes without telling the others:

```
Result  = { player, game, date (YYYY-MM-DD), result (number) }
Standing = { player, points, wins }
```

## Proposed stack (change it if the team agrees)

- Plain HTML, CSS and JavaScript, hosted free on GitHub Pages, so friends just open a link.
- Shared data in a free hosted database (Supabase or Firebase), since everyone needs the same
  scoreboard.
- Parsers and scoring are plain JavaScript functions with no database, tested with `node --test`.
  They can be built and tested before the site exists.

## How we keep from colliding

- `main` always works. Nobody pushes to `main` directly.
- Each piece is built on its own branch (`parsers`, `scoring`, `site`) and merged by pull request.
- The person who did not write a pull request reviews and merges it.
- Changes to this plan or to the shapes above go in their own pull request and get a `LOG.md` entry.
