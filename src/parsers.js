// Parsers: share text in, { game, puzzle, result, failed } out (see PLAN.md, "Games").
// Each game also says which results are better, so scoring never needs game-specific code.

const CONNECTIONS_SQUARE = /[🟨🟩🟦🟪]/gu;

export const GAMES = {
  wordle: {
    name: "Wordle",
    url: "https://www.nytimes.com/games/wordle/index.html",
    unit: "guesses",
    lowerIsBetter: true,
  },
  connections: {
    name: "Connections",
    url: "https://www.nytimes.com/games/connections",
    unit: "mistakes",
    lowerIsBetter: true,
  },
  dailytens: {
    name: "Daily Tens",
    url: "https://dailytens.com/",
    unit: "right",
    lowerIsBetter: false,
  },
  krillion: {
    name: "Krillion",
    url: "https://krillion.io/",
    unit: "points",
    lowerIsBetter: false,
  },
};

/** Wordle 1,234 3/6 (X/6 = failed; a trailing * marks hard mode). */
function parseWordle(text) {
  const m = text.match(/Wordle\s+([\d,.\s]*\d)\s+([1-6Xx])\/6\*?/);
  if (!m) {
    return null;
  }
  const puzzle = Number(m[1].replace(/[,.\s]/g, ""));
  const failed = m[2].toUpperCase() === "X";
  return { game: "wordle", puzzle, result: failed ? 7 : Number(m[2]), failed };
}

/** Connections / Puzzle #512 / one row of four colored squares per guess. */
function parseConnections(text) {
  const m = text.match(/Connections\s*\n?\s*Puzzle\s*#\s*([\d,]+)/i);
  if (!m) {
    return null;
  }
  const rows = text
    .split("\n")
    .map((line) => line.match(CONNECTIONS_SQUARE) || [])
    .filter((squares) => squares.length === 4);
  if (rows.length === 0) {
    return null;
  }
  const solved = rows.filter((row) => row.every((sq) => sq === row[0])).length;
  const mistakes = rows.length - solved;
  return {
    game: "connections",
    puzzle: Number(m[1].replace(/,/g, "")),
    result: mistakes,
    failed: solved < 4,
  };
}

/** DailyTens #916, then one 🏆 (right) or ❌ (wrong) per question. */
function parseDailyTens(text) {
  const m = text.match(/Daily\s*Tens\s*#\s*(\d+)/i);
  if (!m) {
    return null;
  }
  const right = (text.match(/🏆/gu) || []).length;
  const wrong = (text.match(/❌/gu) || []).length;
  if (right + wrong === 0) {
    return null;
  }
  return { game: "dailytens", puzzle: Number(m[1]), result: right, failed: false };
}

/** Krillion #116 🦐, then the score on the next line. */
function parseKrillion(text) {
  const m = text.match(/Krillion\s*#\s*(\d+)[^\n]*\n\s*([\d,]+)/i);
  if (!m) {
    return null;
  }
  return {
    game: "krillion",
    puzzle: Number(m[1]),
    result: Number(m[2].replace(/,/g, "")),
    failed: false,
  };
}

const PARSERS = [parseWordle, parseConnections, parseDailyTens, parseKrillion];

/**
 * Reads one pasted share. Returns { game, puzzle, result, failed }, or null if the text is not a
 * share from a known game. Extra lines (links, emoji rows) are ignored.
 */
export function parseShare(text) {
  if (typeof text !== "string") {
    return null;
  }
  const clean = text.replace(/\r\n?/g, "\n");
  for (const parse of PARSERS) {
    const parsed = parse(clean);
    if (parsed && Number.isFinite(parsed.puzzle) && Number.isFinite(parsed.result)) {
      return parsed;
    }
  }
  return null;
}

/** Human-readable result, e.g. "3 guesses", "X (failed)", "6 right". */
export function describeResult(entry) {
  const game = GAMES[entry.game];
  if (entry.game === "wordle" && entry.failed) {
    return "X (failed)";
  }
  const text = `${entry.result} ${game.unit}`;
  return entry.failed ? `${text} (failed)` : text;
}
