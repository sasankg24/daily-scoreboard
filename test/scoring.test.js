import { test } from "node:test";
import assert from "node:assert/strict";
import { gameWinners, dayResults, monthStandings, monthsWithResults, addEntry } from "../src/scoring.js";

const e = (player, game, result, date = "2026-11-08", failed = false) => ({
  player, game, puzzle: 1, result, failed, date,
});

test("R2: a solo winner gets 2 points", () => {
  assert.deepEqual(gameWinners([e("A", "wordle", 3), e("B", "wordle", 4)]), { winners: ["A"], points: 2 });
});

test("R2: tied winners get 1 point each", () => {
  assert.deepEqual(gameWinners([e("A", "dailytens", 7), e("B", "dailytens", 7), e("C", "dailytens", 5)]), {
    winners: ["A", "B"], points: 1,
  });
});

test("R1: higher wins for Krillion, lower wins for Connections", () => {
  assert.deepEqual(gameWinners([e("A", "krillion", 210), e("B", "krillion", 305)]).winners, ["B"]);
  assert.deepEqual(gameWinners([e("A", "connections", 0), e("B", "connections", 2)]).winners, ["A"]);
});

test("A failed game never wins; if everyone failed there is no winner", () => {
  assert.deepEqual(gameWinners([e("A", "wordle", 7, "2026-11-08", true), e("B", "wordle", 6)]).winners, ["B"]);
  assert.deepEqual(gameWinners([e("A", "wordle", 7, "2026-11-08", true)]), { winners: [], points: 0 });
});

test("R3 and R4: missing a game scores 0; daily winner has the most points", () => {
  const entries = [
    e("A", "wordle", 3), e("B", "wordle", 4),
    e("A", "krillion", 100), e("B", "krillion", 300),
    e("B", "dailytens", 8),
  ];
  const day = dayResults(entries, "2026-11-08");
  assert.deepEqual(day.points, { A: 2, B: 4 });
  assert.deepEqual(day.winners, ["B"]);
});

test("R5: points reset each month", () => {
  const entries = [e("A", "wordle", 3, "2026-10-31"), e("B", "wordle", 3, "2026-11-01"), e("A", "wordle", 5, "2026-11-01")];
  const nov = monthStandings(entries, ["A", "B"], "2026-11");
  assert.equal(nov.overall.find((r) => r.player === "A").points, 0);
  assert.deepEqual(nov.winners, ["B"]);
  assert.deepEqual(nov.games.wordle.winners, ["B"]);
});

test("Monthly standings count points, game wins and day wins", () => {
  const entries = [
    e("A", "wordle", 3, "2026-11-01"), e("B", "wordle", 3, "2026-11-01"),
    e("A", "krillion", 400, "2026-11-02"), e("B", "krillion", 200, "2026-11-02"),
  ];
  const nov = monthStandings(entries, ["A", "B", "C"], "2026-11");
  assert.deepEqual(nov.overall[0], { player: "A", points: 3, wins: 2, dayWins: 2 });
  assert.deepEqual(nov.overall.map((r) => r.player), ["A", "B", "C"]);
  assert.equal(nov.days, 2);
});

test("R6: earlier months stay listed, newest first", () => {
  const entries = [e("A", "wordle", 3, "2026-10-05"), e("A", "wordle", 3, "2026-11-01")];
  assert.deepEqual(monthsWithResults(entries), ["2026-11", "2026-10"]);
});

test("Pasting the same game twice on a day replaces the first entry", () => {
  const once = addEntry([], e("A", "wordle", 5));
  const twice = addEntry(once, e("A", "wordle", 3));
  assert.equal(twice.length, 1);
  assert.equal(twice[0].result, 3);
});
