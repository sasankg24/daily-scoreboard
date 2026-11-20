import { test } from "node:test";
import assert from "node:assert/strict";
import { resultId, toResultDoc, toEntries, loginEmail, signUpProblem, authMessage, uniqueNames } from "../src/records.js";
import { parseShare } from "../src/parsers.js";

test("result id is date_game_uid, one per player per game per day", () => {
  assert.equal(resultId("2026-11-18", "wordle", "abc"), "2026-11-18_wordle_abc");
});

test("a parsed share becomes exactly the fields the security rules allow", () => {
  const parsed = parseShare("Krillion #116 🦐\n210");
  const doc = toResultDoc("abc", "Sasank", parsed, "2026-11-18", "TS");
  assert.deepEqual(Object.keys(doc).sort(),
    ["date", "failed", "game", "player", "puzzle", "result", "submittedAt", "uid"]);
  assert.deepEqual(doc, {
    uid: "abc", player: "Sasank", game: "krillion", puzzle: 116, result: 210,
    failed: false, date: "2026-11-18", submittedAt: "TS",
  });
});

test("a bad date or unknown game is refused before it reaches the database", () => {
  const parsed = parseShare("Wordle 1,234 3/6");
  assert.throws(() => toResultDoc("abc", "S", parsed, "11/18/2026", "TS"));
  assert.throws(() => toResultDoc("abc", "S", { ...parsed, game: "chess" }, "2026-11-18", "TS"));
});

test("entries show each uid's current name, so renames keep old results", () => {
  const docs = [{ uid: "a", player: "Old", game: "wordle", puzzle: 1, result: 3, failed: false, date: "2026-11-18" }];
  assert.equal(toEntries(docs, { a: "New" })[0].player, "New");
  assert.equal(toEntries(docs, {})[0].player, "Old");
});

test("malformed documents are skipped instead of breaking the scoreboard", () => {
  assert.equal(toEntries([null, { game: "chess", date: "2026-11-18" }, { game: "wordle" }], {}).length, 0);
});

test("a name maps to one private login address, ignoring case and spaces around it", () => {
  assert.equal(loginEmail("Sasank"), "sasank@users.daily-scoreboard.app");
  assert.equal(loginEmail("  sasank "), loginEmail("SASANK"));
});

test("sign-up checks the name and password before contacting Firebase", () => {
  assert.equal(signUpProblem("", "secret1"), "Enter a name.");
  assert.match(signUpProblem("x".repeat(21), "secret1"), /20 characters/);
  assert.match(signUpProblem("Big Z", "secret1"), /no spaces/);
  assert.match(signUpProblem("a@b", "secret1"), /no spaces/);
  assert.match(signUpProblem("Zach", "12345"), /at least 6/);
  assert.equal(signUpProblem("Zach_99", "123456"), "");
});

test("sign-in errors become plain messages", () => {
  assert.match(authMessage("auth/invalid-credential"), /don't match/);
  assert.match(authMessage("auth/email-already-in-use"), /already has that name/);
  assert.match(authMessage("auth/something-new"), /something-new/);
});

test("a friend with an old phone identity and a new account is listed once", () => {
  assert.deepEqual(uniqueNames({ old: "Zach", acct: "Zach", me: "Sasank", x: "zach" }), ["Sasank", "Zach"]);
});
