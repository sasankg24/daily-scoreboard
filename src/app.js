// The page: paste box, day view and month view. Parsing and scoring live in their own modules.

import { GAMES, parseShare, describeResult } from "./parsers.js";
import { dayResults, monthStandings, monthsWithResults, addEntry } from "./scoring.js";

const STORAGE_KEY = "daily-scoreboard-v1";
const LAST_PLAYER_KEY = "daily-scoreboard-last-player";

const $ = (id) => document.getElementById(id);

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.players) && Array.isArray(saved.entries)) {
      return saved;
    }
  } catch {
    // Storage blocked or corrupt: start empty.
  }
  return { players: [], entries: [] };
}

let state = load();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showMessage("data-message", "Couldn't save in this browser. Export a backup.", true);
  }
}

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

function names(list) {
  return list.map(escapeHtml).join(" & ");
}

function monthLabel(month) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

// ---- Rendering ----

function renderGameLinks() {
  $("game-links").innerHTML = Object.values(GAMES)
    .map((g) => `<a href="${g.url}" target="_blank" rel="noopener">${g.name}</a>`)
    .join("");
}

function renderPlayers() {
  const select = $("player-select");
  let last = "";
  try { last = localStorage.getItem(LAST_PLAYER_KEY) || ""; } catch { /* ignore */ }
  const current = select.value || last;
  select.innerHTML = state.players.length
    ? state.players.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("")
    : `<option value="">Add a player first</option>`;
  if (state.players.includes(current)) {
    select.value = current;
  }
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
          <td class="num"><button class="small" data-remove="${escapeHtml(e.player)}|${game}|${date}" aria-label="Remove">✕</button></td>
        </tr>`).join("")}</tbody></table>`;
  }

  const missing = state.players.filter((p) => !day.points[p] && !state.entries.some((e) => e.date === date && e.player === p));
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

function renderAll() {
  renderPlayers();
  renderDay();
  renderMonths();
}

// ---- Events ----

$("new-player-btn").addEventListener("click", () => {
  $("new-player-row").classList.toggle("hidden");
  $("new-player-name").focus();
});

$("save-player-btn").addEventListener("click", () => {
  const name = $("new-player-name").value.trim();
  if (!name) {
    return;
  }
  if (!state.players.some((p) => p.toLowerCase() === name.toLowerCase())) {
    state.players.push(name);
    save();
  }
  $("new-player-name").value = "";
  $("new-player-row").classList.add("hidden");
  renderAll();
  $("player-select").value = name;
});

$("add-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const player = $("player-select").value;
  if (!player) {
    showMessage("add-message", "Add a player first (+ Player).", true);
    return;
  }
  const parsed = parseShare($("share-text").value);
  if (!parsed) {
    showMessage("add-message", "That doesn't look like a Wordle, Connections, Daily Tens or Krillion share.", true);
    return;
  }
  const date = $("add-date").value || today();
  state.entries = addEntry(state.entries, { player, date, ...parsed });
  save();
  try { localStorage.setItem(LAST_PLAYER_KEY, player); } catch { /* ignore */ }
  $("share-text").value = "";
  $("day-date").value = date;
  showMessage("add-message", `Saved ${GAMES[parsed.game].name} #${parsed.puzzle}: ${describeResult(parsed)} for ${player}.`);
  renderAll();
});

$("day-view").addEventListener("click", (event) => {
  const key = event.target.dataset?.remove;
  if (!key) {
    return;
  }
  const [player, game, date] = key.split("|");
  state.entries = state.entries.filter((e) => !(e.player === player && e.game === game && e.date === date));
  save();
  renderAll();
});

$("day-date").addEventListener("change", renderDay);
$("month-select").addEventListener("change", renderMonths);

$("export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `daily-scoreboard-${today()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

$("import-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.players) || !Array.isArray(data.entries)) {
      throw new Error("bad file");
    }
    state = { players: data.players, entries: data.entries };
    save();
    renderAll();
    showMessage("data-message", `Imported ${data.entries.length} results.`);
  } catch {
    showMessage("data-message", "That file isn't a Daily Scoreboard backup.", true);
  }
  event.target.value = "";
});

// ---- Start ----

$("add-date").value = today();
$("day-date").value = today();
renderGameLinks();
renderAll();
