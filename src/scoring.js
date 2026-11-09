// Scoring: rules R1 to R6 in PLAN.md. Plain functions, no storage, so they are easy to test.
// An entry is { player, game, puzzle, result, failed, date: "YYYY-MM-DD" }.

import { GAMES } from "./parsers.js";

const SOLO_WIN_POINTS = 2;
const TIED_WIN_POINTS = 1;

/** True if result a beats result b for this game. */
function beats(game, a, b) {
  return GAMES[game].lowerIsBetter ? a < b : a > b;
}

/**
 * Winners of one game on one day (R1). A failed result never wins, so if everyone failed
 * there is no winner. Returns the winning players and the points each one gets (R2).
 */
export function gameWinners(entries) {
  const contenders = entries.filter((e) => !e.failed);
  if (contenders.length === 0) {
    return { winners: [], points: 0 };
  }
  let best = contenders[0].result;
  for (const e of contenders) {
    if (beats(e.game, e.result, best)) {
      best = e.result;
    }
  }
  const winners = [...new Set(contenders.filter((e) => e.result === best).map((e) => e.player))];
  // R2: a solo winner gets 2 points; tied winners get 1 point each.
  return { winners, points: winners.length === 1 ? SOLO_WIN_POINTS : TIED_WIN_POINTS };
}

/**
 * One day's results. R3: anyone without an entry for a game simply can't win it, so they get
 * 0 points for that game. R4: the daily winner is whoever has the most points that day.
 */
export function dayResults(entries, date) {
  const today = entries.filter((e) => e.date === date);
  const games = {};
  const points = {};
  for (const game of Object.keys(GAMES)) {
    const forGame = today.filter((e) => e.game === game);
    if (forGame.length === 0) {
      continue;
    }
    const result = gameWinners(forGame);
    games[game] = { ...result, entries: forGame };
    for (const player of result.winners) {
      points[player] = (points[player] || 0) + result.points;
    }
  }
  return { date, games, points, winners: topPlayers(points) };
}

/** Everyone tied for the most points, or [] if nobody scored. */
function topPlayers(points) {
  const max = Math.max(0, ...Object.values(points));
  if (max === 0) {
    return [];
  }
  return Object.keys(points).filter((p) => points[p] === max).sort();
}

function sortStandings(rows) {
  return rows.sort((a, b) => b.points - a.points || b.wins - a.wins || a.player.localeCompare(b.player));
}

/**
 * Standings for one month, "YYYY-MM" (R5). Points start from zero each month. Returns the overall
 * table, a table per game, and the winners of each (everyone tied for first).
 */
export function monthStandings(entries, players, month) {
  const inMonth = entries.filter((e) => e.date.startsWith(month));
  const dates = [...new Set(inMonth.map((e) => e.date))].sort();
  const everyone = [...new Set([...players, ...inMonth.map((e) => e.player)])];

  const overall = Object.fromEntries(everyone.map((p) => [p, { player: p, points: 0, wins: 0, dayWins: 0 }]));
  const perGame = Object.fromEntries(
    Object.keys(GAMES).map((g) => [g, Object.fromEntries(everyone.map((p) => [p, { player: p, points: 0, wins: 0 }]))]),
  );

  for (const date of dates) {
    const day = dayResults(inMonth, date);
    for (const [game, result] of Object.entries(day.games)) {
      for (const player of result.winners) {
        overall[player].points += result.points;
        overall[player].wins += 1;
        perGame[game][player].points += result.points;
        perGame[game][player].wins += 1;
      }
    }
    for (const player of day.winners) {
      overall[player].dayWins += 1;
    }
  }

  const overallRows = sortStandings(Object.values(overall));
  const games = {};
  for (const game of Object.keys(GAMES)) {
    const rows = sortStandings(Object.values(perGame[game]));
    games[game] = { rows, winners: leaders(rows) };
  }
  return { month, days: dates.length, overall: overallRows, winners: leaders(overallRows), games };
}

function leaders(rows) {
  const max = rows.length ? rows[0].points : 0;
  return max > 0 ? rows.filter((r) => r.points === max).map((r) => r.player) : [];
}

/** Every month that has results, newest first (R6: earlier months stay viewable). */
export function monthsWithResults(entries) {
  return [...new Set(entries.map((e) => e.date.slice(0, 7)))].sort().reverse();
}

/**
 * Adds an entry, replacing any earlier entry by the same player for the same game on the same
 * day, so pasting twice never counts twice.
 */
export function addEntry(entries, entry) {
  const others = entries.filter(
    (e) => !(e.player === entry.player && e.game === entry.game && e.date === entry.date),
  );
  return [...others, entry];
}
