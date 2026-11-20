// Records: how results and players are stored in the shared database (docs/moonshot-plan.md,
// Week 2). Plain functions with no Firebase in them, so they can be tested with node --test.
// The security rules in firestore.rules check the same shapes on the server.

import { GAMES } from "./parsers.js";

export const MAX_NAME_LENGTH = 20;
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Accounts are a name and a password. Firebase's password sign-in needs an email address, so
 * each name maps to a private login address that nobody types or receives mail at. Because the
 * address is lowercased, names are unique ignoring case. firestore.rules uses the same domain.
 */
export const LOGIN_DOMAIN = "users.daily-scoreboard.app";

/** Letters, digits, dot, dash and underscore only: anything else can't be part of an email. */
const NAME_PATTERN = /^[A-Za-z0-9._-]+$/;

/** The private login address for a name. */
export function loginEmail(name) {
  return `${name.trim().toLowerCase()}@${LOGIN_DOMAIN}`;
}

/** Checks a name and password before signing up. Returns an error message, or "" if fine. */
export function signUpProblem(name, password) {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return "Enter a name.";
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Keep your name to ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  if (!NAME_PATTERN.test(trimmed)) {
    return "Names can use letters, numbers, dots, dashes and underscores, with no spaces.";
  }
  if ((password || "").length < MIN_PASSWORD_LENGTH) {
    return `Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return "";
}

/** Turns a Firebase sign-in error code into a message a friend understands. */
export function authMessage(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "That name and password don't match. Check both and try again.";
    case "auth/email-already-in-use":
      return "Someone already has that name. Sign in instead, or pick another name.";
    case "auth/weak-password":
      return `Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`;
    case "auth/too-many-requests":
      return "Too many tries. Wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Can't reach the scoreboard. Check your connection.";
    default:
      return `Something went wrong (${code}).`;
  }
}

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
 * The list of player names, one per name ignoring case. When a friend moves from an old
 * phone-only identity to an account with the same name, both identities have that name; the
 * scoreboard should list them once (their results already score together, by name).
 */
export function uniqueNames(namesByUid) {
  const seen = new Map();
  for (const name of Object.values(namesByUid)) {
    const key = String(name).toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, name);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
