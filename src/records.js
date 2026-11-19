// Records: how results and players are stored in the shared database (docs/moonshot-plan.md,
// Week 2). Plain functions with no Firebase in them, so they can be tested with node --test.
// The security rules in firestore.rules check the same shapes on the server.

import { GAMES } from "./parsers.js";

export const MAX_NAME_LENGTH = 20;

/** One result per player, per game, per day: the document id the rules require. */
export function resultId(date, game, uid) {
  return `${date}_${game}_${uid}`;
}

/** The document stored for one parsed share. The player name is kept for reading the raw data. */
export function toResultDoc(uid, player, parsed, date, submittedAt) {
  if (!GAMES[parsed.game]) {
    throw new Error(`Unknown game: ${parsed.game}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Bad date: ${date}`);
  }
  return {
    uid,
    player,
    game: parsed.game,
    puzzle: Math.trunc(parsed.puzzle),
    result: parsed.result,
    failed: Boolean(parsed.failed),
    date,
    submittedAt,
  };
}

/**
 * Turns stored result documents into the entries the scoring code uses. The player shown is
 * the uid's current name, so a renamed player keeps all their old results.
 */
export function toEntries(resultDocs, namesByUid) {
  return resultDocs
    .filter((d) => d && GAMES[d.game] && typeof d.date === "string")
    .map((d) => ({
      uid: d.uid,
      player: namesByUid[d.uid] || d.player || "Unknown",
      game: d.game,
      puzzle: d.puzzle,
      result: d.result,
      failed: d.failed,
      date: d.date,
    }));
}

/**
 * Checks a name before saving it. Returns an error message, or "" if it is fine. Names must be
 * unique ignoring case, because the scoreboard shows players by name.
 */
export function nameProblem(name, uid, namesByUid) {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return "Enter a name.";
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Keep it to ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  const taken = Object.entries(namesByUid)
    .some(([otherUid, other]) => otherUid !== uid && other.toLowerCase() === trimmed.toLowerCase());
  return taken ? "Someone in the group already uses that name." : "";
}
