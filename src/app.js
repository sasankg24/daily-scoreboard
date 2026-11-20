// The page: name, paste box, day view and month view. Parsing and scoring live in their own
// modules, the database in store.js. Results are shared live with the whole group.

import { GAMES, parseShare, describeResult } from "./parsers.js";
import { dayResults, monthStandings, monthsWithResults } from "./scoring.js";
import { toEntries, signUpProblem, authMessage, uniqueNames } from "./records.js";
import { connect, currentUid, signUp, signIn, signOut, saveResult, removeResult } from "./store.js";

const $ = (id) => document.getElementById(id);

// Live state from the database.
const state = { uid: null, signedOut: false, myName: "", namesByUid: {}, resultDocs: [], entries: [], players: [] };

function today() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function showMessage(id, text, isError = false) {
  const el = $(id);
  el.textContent = text;
  el.className = `message ${isError ? "error" : "ok"}`;
}

function setStatus(text, kind = "") {
  const el = $("status");
  el.textContent = text;
  el.className = `status ${kind}`;
}

function names(list) {
  return list.map(escapeHtml).join(" & ");
}

function monthLabel(month) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function myName() {
  return state.namesByUid[state.uid] || state.myName;
}

// ---- Rendering ----

function renderGameLinks() {
  $("game-links").innerHTML = Object.values(GAMES)
    .map((g) => `<a href="${g.url}" target="_blank" rel="noopener">${g.name}</a>`)
    .join("");
}

function renderName() {
  // Before Firebase reports in, show neither card.
  $("signin-card").classList.toggle("hidden", !state.signedOut);
  $("add-card").classList.toggle("hidden", !state.uid);
  $("me-name").textContent = myName();
}

function renderDay() {
  const date = $("day-date").value || today();
  const day = dayResults(state.entries, date);
  const games = Object.keys(day.games);
  if (games.length === 0) {
    $("day-view").innerHTML = `<p class="empty">No results for this day yet.</p>`;
    return;
  }

  let html = day.winners.length
    ? `<div class="banner"><span class="crown">👑</span> Day winner: ${names(day.winners)} (${day.points[day.winners[0]]} pts)</div>`
    : "";

  for (const game of Object.keys(GAMES)) {
    const result = day.games[game];
    if (!result) {
      continue;
    }
    const sorted = [...result.entries].sort((a, b) =>
      (a.failed - b.failed) || (GAMES[game].lowerIsBetter ? a.result - b.result : b.result - a.result));
    html += `<h3>${GAMES[game].name}${result.winners.length ? ` · ${names(result.winners)} +${result.points}` : " · no winner"}</h3>
      <table><tbody>${sorted.map((e) => `
        <tr class="${result.winners.includes(e.player) ? "winner" : ""}">
          <td>${escapeHtml(e.player)}</td>
          <td class="num">${escapeHtml(describeResult(e))}</td>
          <td class="num">${e.uid === state.uid
            ? `<button class="small" data-remove="${game}|${date}" aria-label="Remove my result">✕</button>` : ""}</td>
        </tr>`).join("")}</tbody></table>`;
  }

  const missing = state.players.filter((p) => !state.entries.some((e) => e.date === date && e.player === p));
  if (missing.length) {
    html += `<p class="note" style="margin-top:10px">No results yet from ${names(missing)}.</p>`;
  }
  $("day-view").innerHTML = html;
}

function standingsTable(rows, winners, columns) {
  return `<table><thead><tr><th>Player</th>${columns.map((c) => `<th class="num">${c.label}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr class="${winners.includes(r.player) ? "winner" : ""}">
      <td>${escapeHtml(r.player)}</td>${columns.map((c) => `<td class="num">${r[c.key]}</td>`).join("")}</tr>`).join("")}
    </tbody></table>`;
}

function renderMonths() {
  const select = $("month-select");
  const months = [...new Set([today().slice(0, 7), ...monthsWithResults(state.entries)])].sort().reverse();
  const chosen = months.includes(select.value) ? select.value : months[0];
  select.innerHTML = months.map((m) => `<option value="${m}">${monthLabel(m)}</option>`).join("");
  select.value = chosen;

  const standings = monthStandings(state.entries, state.players, chosen);
  if (standings.overall.length === 0) {
    $("month-view").innerHTML = `<p class="empty">No players yet.</p>`;
    return;
  }
  const isPast = chosen < today().slice(0, 7);
  let html = standings.winners.length
    ? `<div class="banner"><span class="crown">🏆</span> ${isPast ? "Month winner" : "Leading"}: ${names(standings.winners)}</div>`
    : `<p class="empty">No points yet this month.</p>`;
  html += `<h3>Overall</h3>` + standingsTable(standings.overall, standings.winners, [
    { label: "Pts", key: "points" }, { label: "Game wins", key: "wins" }, { label: "Day wins", key: "dayWins" },
  ]);
  for (const game of Object.keys(GAMES)) {
    const g = standings.games[game];
    html += `<h3>${GAMES[game].name}${g.winners.length ? ` · ${names(g.winners)}` : ""}</h3>`
      + standingsTable(g.rows, g.winners, [{ label: "Pts", key: "points" }, { label: "Wins", key: "wins" }]);
  }
  $("month-view").innerHTML = html;
}

function refresh() {
  state.players = uniqueNames(state.namesByUid);
  state.entries = toEntries(state.resultDocs, state.namesByUid);
  renderName();
  renderDay();
  renderMonths();
}

// ---- Events ----

function signInBusy(busy) {
  $("signin-btn").disabled = busy;
  $("signup-btn").disabled = busy;
}

$("signin-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  signInBusy(true);
  try {
    await signIn($("signin-name").value, $("signin-password").value);
    showMessage("signin-message", "");
  } catch (error) {
    showMessage("signin-message", authMessage(error.code), true);
  } finally {
    signInBusy(false);
  }
});

$("signup-btn").addEventListener("click", async () => {
  const name = $("signin-name").value;
  const password = $("signin-password").value;
  const problem = signUpProblem(name, password);
  if (problem) {
    showMessage("signin-message", problem, true);
    return;
  }
  signInBusy(true);
  try {
    await signUp(name, password);
    showMessage("signin-message", "");
  } catch (error) {
    showMessage("signin-message", authMessage(error.code), true);
  } finally {
    signInBusy(false);
  }
});

$("signout-btn").addEventListener("click", () => signOut());

$("add-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const parsed = parseShare($("share-text").value);
  if (!parsed) {
    showMessage("add-message", "That doesn't look like a Wordle, Connections, Daily Tens or Krillion share.", true);
    return;
  }
  const date = $("add-date").value || today();
  try {
    await saveResult(myName(), parsed, date);
    $("share-text").value = "";
    $("day-date").value = date;
    showMessage("add-message", `Saved ${GAMES[parsed.game].name} #${parsed.puzzle}: ${describeResult(parsed)}.`);
  } catch (error) {
    showMessage("add-message", `Couldn't save it (${error.code || error.message}). Check your connection and try again.`, true);
  }
});

$("day-view").addEventListener("click", async (event) => {
  const key = event.target.dataset?.remove;
  if (!key) {
    return;
  }
  const [game, date] = key.split("|");
  try {
    await removeResult(date, game);
  } catch (error) {
    showMessage("add-message", `Couldn't remove it (${error.code || error.message}).`, true);
  }
});

$("day-date").addEventListener("change", renderDay);
$("month-select").addEventListener("change", renderMonths);

$("export-btn").addEventListener("click", () => {
  const data = { exported: new Date().toISOString(), players: state.namesByUid, results: state.entries };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `daily-scoreboard-${today()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

// ---- Start ----

$("add-date").value = today();
$("day-date").value = today();
renderGameLinks();
refresh();
$("add-card").classList.add("hidden");

connect({
  onSignedIn: (uid, name) => {
    state.uid = uid;
    state.myName = name;
    state.signedOut = false;
    $("signin-password").value = "";
    setStatus("Live: everyone sees the same scoreboard", "live");
    refresh();
  },
  onSignedOut: () => {
    state.uid = null;
    state.myName = "";
    state.signedOut = true;
    state.namesByUid = {};
    state.resultDocs = [];
    setStatus("Sign in to see the scoreboard.");
    refresh();
  },
  onPlayers: (namesByUid) => {
    state.namesByUid = namesByUid;
    refresh();
  },
  onResults: (docs) => {
    state.resultDocs = docs;
    refresh();
  },
  onError: (error) => {
    setStatus(`Can't reach the scoreboard right now (${error.code || error.message}).`, "error");
  },
});

// Exposed for debugging in the browser console.
window.scoreboard = { state, currentUid };
