import { test } from "node:test";
import assert from "node:assert/strict";
import { parseShare } from "../src/parsers.js";

// Real share texts from the group chat (PLAN.md), plus the standard NYT formats.

test("Daily Tens: counts the trophies", () => {
  const text = `DailyTens #916

🏆 ❌
🏆 🏆
🏆 🏆
🏆 ❌
🏆 ❌

https://dailytens.com/?ref=1347968`;
  assert.deepEqual(parseShare(text), { game: "dailytens", puzzle: 916, result: 7, failed: false });
});

test("Krillion: score is the number on the next line", () => {
  const text = `Krillion #116 🦐
210

🫧🫧🐟🦑🦑🐟🫧`;
  assert.deepEqual(parseShare(text), { game: "krillion", puzzle: 116, result: 210, failed: false });
});

test("Wordle: guesses and puzzle number with a comma", () => {
  const text = `Wordle 1,234 3/6

⬛🟨⬛⬛⬛
🟩🟩⬛🟨⬛
🟩🟩🟩🟩🟩`;
  assert.deepEqual(parseShare(text), { game: "wordle", puzzle: 1234, result: 3, failed: false });
});

test("Wordle: X/6 is a failed game", () => {
  assert.deepEqual(parseShare("Wordle 1,602 X/6\n\n⬛⬛⬛⬛⬛"), {
    game: "wordle", puzzle: 1602, result: 7, failed: true,
  });
});

test("Wordle: hard mode star is ignored", () => {
  assert.equal(parseShare("Wordle 1,602 4/6*").result, 4);
});

test("Connections: mixed rows are mistakes", () => {
  const text = `Connections
Puzzle #512
🟨🟨🟨🟨
🟩🟪🟩🟩
🟩🟩🟩🟩
🟦🟦🟦🟦
🟪🟪🟪🟪`;
  assert.deepEqual(parseShare(text), { game: "connections", puzzle: 512, result: 1, failed: false });
});

test("Connections: four mistakes without solving is a failed game", () => {
  const text = `Connections
Puzzle #513
🟨🟩🟨🟨
🟩🟪🟩🟩
🟦🟦🟨🟦
🟪🟪🟪🟦`;
  const parsed = parseShare(text);
  assert.equal(parsed.result, 4);
  assert.equal(parsed.failed, true);
});

test("Windows line endings still parse", () => {
  assert.equal(parseShare("Krillion #117 🦐\r\n305").result, 305);
});

test("Text that isn't a share returns null", () => {
  assert.equal(parseShare("Point me!!"), null);
  assert.equal(parseShare(""), null);
  assert.equal(parseShare(undefined), null);
});
