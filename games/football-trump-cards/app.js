import {
  applyAction,
  createGame,
  getBotMove,
  STATS,
  STAT_LABELS,
  PLAYER_VISUALS,
  updateCurrentSeasonData,
  getLastLiveUpdate,
} from "./game.js";

// ================================================
// Player SVG Fallback
// ================================================
function generatePlayerSVG(accentColor) {
  const c = accentColor || "#fff";
  return `<svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="20" r="12" fill="${c}" opacity="0.3"/><rect x="28" y="34" width="24" height="28" rx="4" fill="${c}" opacity="0.2"/><circle cx="40" cy="72" r="8" stroke="${c}" stroke-width="2" opacity="0.3" fill="none"/><path d="M36 68 l-4 22" stroke="${c}" stroke-width="2.5" opacity="0.2" stroke-linecap="round"/><path d="M44 68 l4 22" stroke="${c}" stroke-width="2.5" opacity="0.2" stroke-linecap="round"/></svg>`;
}

// ================================================
// DOM References
// ================================================
const ui = {
  connectionStatus: document.getElementById("connectionStatus"),
  setupPanel: document.getElementById("setupPanel"),
  localSetup: document.getElementById("localSetup"),
  onlineSetup: document.getElementById("onlineSetup"),
  modeButtons: document.querySelectorAll(".brand ~ .panel .mode-toggle:first-child .mode-btn"),
  gameModeBtns: document.querySelectorAll("#gameModeToggle .mode-btn"),
  playerMinus: document.getElementById("playerMinus"),
  playerPlus: document.getElementById("playerPlus"),
  playerCount: document.getElementById("playerCount"),
  localSpectator: document.getElementById("localSpectator"),
  startLocal: document.getElementById("startLocal"),
  onlineName: document.getElementById("onlineName"),
  serverUrl: document.getElementById("serverUrl"),
  roomCode: document.getElementById("roomCode"),
  createRoom: document.getElementById("createRoom"),
  joinRoom: document.getElementById("joinRoom"),
  onlineLobby: document.getElementById("onlineLobby"),
  lobbyPlayers: document.getElementById("lobbyPlayers"),
  roomDisplay: document.getElementById("roomDisplay"),
  copyRoom: document.getElementById("copyRoom"),
  shareLan: document.getElementById("shareLan"),
  addBot: document.getElementById("addBot"),
  startOnline: document.getElementById("startOnline"),
  leaveRoom: document.getElementById("leaveRoom"),
  hostHint: document.getElementById("hostHint"),
  gamePanel: document.getElementById("gamePanel"),
  liveBanner: document.getElementById("liveBanner"),
  liveText: document.getElementById("liveText"),
  turnCard: document.getElementById("turnCard"),
  turnName: document.getElementById("turnName"),
  turnHint: document.getElementById("turnHint"),
  autoPlayToggle: document.getElementById("autoPlayToggle"),
  restartLocal: document.getElementById("restartLocal"),
  warPileIndicator: document.getElementById("warPileIndicator"),
  warPileCount: document.getElementById("warPileCount"),
  opponentsRow: document.getElementById("opponentsRow"),
  revealArea: document.getElementById("revealArea"),
  revealTitle: document.getElementById("revealTitle"),
  revealCards: document.getElementById("revealCards"),
  nextRoundBtn: document.getElementById("nextRoundBtn"),
  playerArea: document.getElementById("playerArea"),
  handPlayerInfo: document.getElementById("handPlayerInfo"),
  handMeta: document.getElementById("handMeta"),
  yourTopCard: document.getElementById("yourTopCard"),
  statButtons: document.getElementById("statButtons"),
  sidebar: document.getElementById("sidebar"),
  sidebarLogs: document.getElementById("sidebarLogs"),
  toggleLogs: document.getElementById("toggleLogs"),
  closeSidebar: document.getElementById("closeSidebar"),
  toast: document.getElementById("toast"),
  winnerBanner: document.getElementById("winnerBanner"),
  winnerName: document.getElementById("winnerName"),
  winnerNewGame: document.getElementById("winnerNewGame"),
};

// ================================================
// State
// ================================================
let mode = "local";
let gameMode = "alltime";
let localState = null;
let onlineState = null;
let myPlayerId = null;
let socket = null;
let roomCode = null;
let isHost = false;
let notice = null;
let noticeTimeout = null;
let autoPlay = false;
let revealTimeout = null;
let liveUpdateInterval = null;

// ================================================
// Utilities
// ================================================
function showNotice(message) {
  notice = message;
  if (noticeTimeout) clearTimeout(noticeTimeout);
  ui.toast.textContent = message;
  ui.toast.classList.add("visible");
  noticeTimeout = setTimeout(() => {
    notice = null;
    noticeTimeout = null;
    ui.toast.classList.remove("visible");
  }, 2500);
}

function clearNotice() {
  if (noticeTimeout) clearTimeout(noticeTimeout);
  noticeTimeout = null;
  notice = null;
  ui.toast.classList.remove("visible");
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function setStatus(text) { ui.connectionStatus.textContent = text; }

function setMode(nextMode) {
  mode = nextMode;
  const btns = ui.setupPanel.querySelectorAll(":scope > .mode-toggle .mode-btn");
  btns.forEach((button) => {
    const active = button.dataset.mode === nextMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  ui.localSetup.classList.toggle("hidden", nextMode !== "local");
  ui.onlineSetup.classList.toggle("hidden", nextMode !== "online");
  ui.restartLocal.classList.toggle("hidden", nextMode !== "local");
  setStatus(nextMode === "local" ? "Local" : "Offline");
}

function currentState() { return mode === "online" ? onlineState : localState; }

function currentViewingPlayerId(state) {
  if (!state) return null;
  if (mode === "online") return myPlayerId;
  const human = state.players.find((p) => !p.isBot);
  return human ? human.id : null;
}

// ================================================
// Live Data Fetcher
// ================================================
function startLiveUpdates() {
  if (liveUpdateInterval) clearInterval(liveUpdateInterval);
  if (gameMode !== "current") {
    ui.liveBanner.classList.add("hidden");
    return;
  }

  ui.liveBanner.classList.remove("hidden");
  ui.liveText.textContent = "Current season stats loaded";

  // Fetch live data every 5 minutes
  liveUpdateInterval = setInterval(async () => {
    try {
      // Try fetching from a public football stats API
      // Using a CORS-friendly endpoint for current season top scorers
      const resp = await fetch("https://api.football-data.org/v4/competitions/PL/scorers?limit=30", {
        headers: { "X-Auth-Token": "demo" }, // demo token
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.scorers && data.scorers.length > 0) {
          const mapped = data.scorers.map((s) => ({
            name: s.player.name,
            goals: Math.min(99, Math.round((s.goals || 0) * 3.5)),
            assists: Math.min(99, Math.round((s.assists || 0) * 5)),
            trophies: 50,
            dribbling: 70 + Math.floor(Math.random() * 25),
            passing: 65 + Math.floor(Math.random() * 30),
          }));
          updateCurrentSeasonData(mapped);
          const now = new Date();
          ui.liveText.textContent = `Stats updated at ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
        }
      }
    } catch {
      // Silently fail — use default data
      const lastUpdate = getLastLiveUpdate();
      if (lastUpdate) {
        const d = new Date(lastUpdate);
        ui.liveText.textContent = `Last update: ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
      } else {
        ui.liveText.textContent = "Using default season stats";
      }
    }
  }, 5 * 60 * 1000);
}

// ================================================
// Rendering
// ================================================
function render() {
  const state = currentState();
  if (!state) {
    ui.gamePanel.classList.add("hidden");
    ui.winnerBanner.classList.add("hidden");
    return;
  }

  ui.gamePanel.classList.remove("hidden");

  const viewingPlayerId = currentViewingPlayerId(state);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === viewingPlayerId;
  const meIndex = state.players.findIndex((p) => p.id === viewingPlayerId);
  const me = meIndex >= 0 ? state.players[meIndex] : null;

  // Turn info
  ui.turnName.textContent = isMyTurn ? "Your Turn" : `${currentPlayer?.name || "?"}'s Turn`;
  ui.turnCard.classList.toggle("my-turn", isMyTurn);

  if (notice) {
    ui.turnHint.textContent = notice;
  } else if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.turnHint.textContent = winner ? `${winner.name} is the champion!` : "Match over.";
  } else if (state.phase === "revealing" && isMyTurn) {
    ui.turnHint.textContent = "Round over — draw your next card!";
  } else if (state.phase === "revealing") {
    ui.turnHint.textContent = `Waiting for ${currentPlayer?.name} to draw...`;
  } else if (state.phase === "picking" && isMyTurn) {
    ui.turnHint.textContent = "Pick a stat to compare";
  } else if (state.phase === "picking") {
    ui.turnHint.textContent = `Waiting for ${currentPlayer?.name} to pick...`;
  } else {
    ui.turnHint.textContent = "Waiting...";
  }

  // Winner banner
  if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.winnerBanner.classList.remove("hidden");
    ui.winnerName.textContent = `${winner?.name || "Someone"} is Champion!`;
  } else {
    ui.winnerBanner.classList.add("hidden");
  }

  // War pile
  if (state.warPile.length > 0) {
    ui.warPileIndicator.classList.remove("hidden");
    ui.warPileCount.textContent = String(state.warPile.length);
  } else {
    ui.warPileIndicator.classList.add("hidden");
  }

  // Opponents
  ui.opponentsRow.innerHTML = "";
  const opponents = state.players.filter((p) => p.id !== viewingPlayerId);
  for (const opp of opponents) {
    const el = document.createElement("div");
    el.className = "opponent-card";
    if (opp.id === currentPlayer?.id) el.classList.add("active");

    const avatar = document.createElement("div");
    avatar.className = "opp-avatar";
    avatar.textContent = opp.name.charAt(0).toUpperCase();

    const info = document.createElement("div");
    const nameEl = document.createElement("div");
    nameEl.className = "opp-name";
    nameEl.textContent = opp.name;
    const countEl = document.createElement("div");
    countEl.className = "opp-count";
    countEl.textContent = `${opp.deck.length} card${opp.deck.length !== 1 ? "s" : ""}`;

    info.appendChild(nameEl);
    info.appendChild(countEl);
    el.appendChild(avatar);
    el.appendChild(info);
    ui.opponentsRow.appendChild(el);
  }

  // Revealed cards
  if (state.revealedCards && state.revealedCards.length > 0 && state.currentStat) {
    ui.revealArea.classList.remove("hidden");
    const stat = state.currentStat;

    let maxVal = -1;
    let winnerIndices = [];
    for (const rc of state.revealedCards) {
      const val = rc.card[stat];
      if (val > maxVal) { maxVal = val; winnerIndices = [rc.playerIndex]; }
      else if (val === maxVal) { winnerIndices.push(rc.playerIndex); }
    }
    const isTie = winnerIndices.length > 1;
    ui.revealTitle.textContent = isTie ? `TIE on ${STAT_LABELS[stat]}!` : `${STAT_LABELS[stat]} Showdown`;

    ui.revealCards.innerHTML = "";
    for (const rc of state.revealedCards) {
      const div = document.createElement("div");
      div.className = "reveal-card";
      const isWinner = winnerIndices.includes(rc.playerIndex) && !isTie;
      const isLoser = !winnerIndices.includes(rc.playerIndex);
      if (isWinner) div.classList.add("winner");
      if (isLoser) div.classList.add("loser");

      const [c1, c2] = rc.card.colors || ["#333", "#666"];
      const imgHtml = rc.card.img
        ? `<img class="rc-photo" src="./assets/${rc.card.img}" alt="${rc.card.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
        : "";
      const fallbackSvg = generatePlayerSVG(c2);

      div.innerHTML = `
        <div class="rc-portrait" style="background:linear-gradient(135deg,${c1},${c2})">
          ${imgHtml}
          <div class="rc-silhouette" style="${rc.card.img ? "display:none" : ""}">${fallbackSvg}</div>
        </div>
        <div class="rc-player">${state.players[rc.playerIndex].name}</div>
        <div class="rc-name">${rc.card.name}</div>
        <div class="rc-stat-label">${STAT_LABELS[stat]}</div>
        <div class="rc-stat-value">${rc.card[stat]}</div>
        <div class="rc-bar"><div class="rc-bar-fill" style="width:${rc.card[stat]}%"></div></div>
      `;
      ui.revealCards.appendChild(div);
    }

    if (state.phase === "revealing" && isMyTurn) {
      ui.nextRoundBtn.classList.remove("hidden");
      ui.nextRoundBtn.disabled = false;
    } else if (state.phase === "revealing") {
      ui.nextRoundBtn.classList.remove("hidden");
      ui.nextRoundBtn.disabled = true;
    } else {
      ui.nextRoundBtn.classList.add("hidden");
    }
  } else {
    ui.revealArea.classList.add("hidden");
  }

  // Player hand info
  ui.handPlayerInfo.innerHTML = "";
  if (me) {
    const nameEl = document.createElement("h2");
    nameEl.className = "hand-player-name";
    nameEl.textContent = me.name;
    if (isMyTurn) nameEl.classList.add("my-turn");
    ui.handPlayerInfo.appendChild(nameEl);
  } else {
    const nameEl = document.createElement("h2");
    nameEl.className = "hand-player-name";
    nameEl.textContent = viewingPlayerId ? "Your Cards" : "Spectating";
    ui.handPlayerInfo.appendChild(nameEl);
  }

  const deckCount = me ? me.deck.length : 0;
  ui.handMeta.textContent = me ? `${deckCount} card${deckCount !== 1 ? "s" : ""} in your deck` : "";

  // Your top card
  ui.yourTopCard.innerHTML = "";
  const topCard = me && me.deck.length > 0 ? me.deck[0] : null;

  if (topCard) {
    if (isMyTurn) ui.yourTopCard.classList.add("active-turn");
    else ui.yourTopCard.classList.remove("active-turn");

    const [c1, c2] = topCard.colors || ["#333", "#666"];
    ui.yourTopCard.style.setProperty("--card-color-1", c1);
    ui.yourTopCard.style.setProperty("--card-color-2", c2);

    // Portrait area
    const portrait = document.createElement("div");
    portrait.className = "player-portrait";
    portrait.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;

    if (topCard.img) {
      const img = document.createElement("img");
      img.className = "player-photo";
      img.src = `./assets/${topCard.img}`;
      img.alt = topCard.name;
      img.onerror = () => {
        img.style.display = "none";
        const fallback = document.createElement("div");
        fallback.className = "player-silhouette";
        fallback.innerHTML = generatePlayerSVG(c2);
        portrait.insertBefore(fallback, portrait.firstChild);
      };
      portrait.appendChild(img);
    } else {
      const silhouette = document.createElement("div");
      silhouette.className = "player-silhouette";
      silhouette.innerHTML = generatePlayerSVG(c2);
      portrait.appendChild(silhouette);
    }

    const alias = document.createElement("div");
    alias.className = "player-alias";
    alias.textContent = topCard.alias || topCard.name.slice(0, 4).toUpperCase();

    portrait.appendChild(alias);
    ui.yourTopCard.appendChild(portrait);

    const name = document.createElement("h2");
    name.className = "player-name";
    name.textContent = topCard.name;
    ui.yourTopCard.appendChild(name);

    const positionEl = document.createElement("div");
    positionEl.className = "player-position";
    positionEl.textContent = topCard.position || "";
    ui.yourTopCard.appendChild(positionEl);

    // Stats shown in the "Pick a Stat" buttons on the right — not duplicated here
  } else {
    ui.yourTopCard.classList.remove("active-turn");
    const msg = document.createElement("div");
    msg.className = "no-card-msg";
    msg.textContent = me ? "No cards remaining" : "Spectating";
    ui.yourTopCard.appendChild(msg);
  }

  // Stat buttons
  const statBtns = ui.statButtons.querySelectorAll(".stat-btn");
  const canPick = isMyTurn && state.phase === "picking" && me && me.deck.length > 0;
  for (const btn of statBtns) {
    const stat = btn.dataset.stat;
    btn.disabled = !canPick;
    const valEl = btn.querySelector(".stat-value");
    const fillEl = btn.querySelector(".stat-fill");
    if (topCard) {
      valEl.textContent = String(topCard[stat]);
      fillEl.style.width = `${topCard[stat]}%`;
    } else {
      valEl.textContent = "-";
      fillEl.style.width = "0%";
    }
  }

  // Logs
  ui.sidebarLogs.innerHTML = "";
  (state.log || []).forEach((entry) => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.textContent = entry;
    ui.sidebarLogs.appendChild(div);
  });

  // Bot automation
  if (mode === "local" && (state.phase === "revealing" || state.phase === "picking")) {
    const cp = state.players[state.currentPlayerIndex];
    if (cp && cp.isBot) {
      if (revealTimeout) clearTimeout(revealTimeout);
      const delay = state.phase === "revealing" ? 2000 : 1800;
      revealTimeout = setTimeout(() => {
        if (!localState) return;
        const botAction = getBotMove(localState, localState.currentPlayerIndex);
        if (botAction) dispatchAction(botAction);
      }, delay);
    } else if (cp && cp.id === viewingPlayerId && autoPlay) {
      if (revealTimeout) clearTimeout(revealTimeout);
      const delay = state.phase === "revealing" ? 1500 : 1200;
      revealTimeout = setTimeout(() => {
        if (!localState) return;
        const idx = localState.players.findIndex((p) => p.id === viewingPlayerId);
        if (idx >= 0) {
          const botAction = getBotMove(localState, idx);
          if (botAction) dispatchAction(botAction);
        }
      }, delay);
    }
  }
}

// ================================================
// Action Dispatch
// ================================================
function dispatchAction(action) {
  if (mode === "online") {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      showNotice("Not connected to the server.");
      return;
    }
    socket.send(JSON.stringify(action));
    return;
  }

  if (!localState) {
    showNotice("Start a match first.");
    return;
  }

  if (revealTimeout) clearTimeout(revealTimeout);
  clearNotice();

  const result = applyAction(localState, action);
  if (result.error) {
    showNotice(result.error);
    return;
  }
  localState = result.state;
  render();
}

// ================================================
// Game Setup
// ================================================
function startLocalGame() {
  const name = document.getElementById("localName").value.trim() || "Manager";
  const botCount = Number(ui.playerCount.textContent);
  const isSpectator = ui.localSpectator.checked;

  const botNames = [
    "Guardiola", "Ancelotti", "Klopp", "Mourinho",
    "Zidane", "Ferguson", "Conte", "Tuchel",
  ];

  const players = [];
  if (!isSpectator) {
    players.push({ id: "p1", name, isBot: false });
  }

  for (let i = 0; i < botCount; i += 1) {
    const botName = botNames[i % botNames.length];
    players.push({ id: `bot${i + 1}`, name: `${botName} (Bot)`, isBot: true });
  }

  if (players.length < 2) {
    const extra = botNames[players.length % botNames.length];
    players.push({ id: "bot_extra", name: `${extra} (Bot)`, isBot: true });
  }

  notice = null;
  localState = createGame({ players, options: { mode: gameMode } });
  myPlayerId = isSpectator ? null : "p1";
  setStatus(isSpectator ? "Spectating" : `${gameMode === "current" ? "Current Season" : "All-Time Legends"}`);
  ui.setupPanel.classList.add("hidden");
  startLiveUpdates();
  render();
}

function resetToSetup() {
  if (revealTimeout) clearTimeout(revealTimeout);
  if (liveUpdateInterval) clearInterval(liveUpdateInterval);
  clearNotice();
  localState = null;
  onlineState = null;
  notice = null;
  autoPlay = false;
  ui.autoPlayToggle.textContent = "Auto Play: Off";
  ui.setupPanel.classList.remove("hidden");
  ui.gamePanel.classList.add("hidden");
  ui.winnerBanner.classList.add("hidden");
  ui.liveBanner.classList.add("hidden");
  ui.toast.classList.remove("visible");
}

// ================================================
// Online Mode
// ================================================
function connectOnline({ create }) {
  const name = ui.onlineName.value.trim() || "Manager";
  const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
  const url = ui.serverUrl.value.trim() || `${wsProtocol}//${location.host}`;
  const rawCode = ui.roomCode.value.trim();
  if (!create && !rawCode) { showNotice("Enter a room code to join."); return; }
  const code = (rawCode || generateRoomCode()).toUpperCase();
  roomCode = code;
  ui.roomCode.value = code;
  if (socket) socket.close();
  socket = new WebSocket(url);
  setStatus("Connecting...");

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ type: "hello", name, room: code, create, gameType: "football-trump-cards" }));
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "welcome") { myPlayerId = message.playerId; setStatus("Connected"); }
    if (message.type === "room_state") {
      roomCode = message.room;
      isHost = message.hostId === myPlayerId;
      ui.roomDisplay.textContent = message.room;
      ui.onlineLobby.classList.remove("hidden");
      ui.lobbyPlayers.innerHTML = "";
      message.players.forEach((player) => {
        const line = document.createElement("div");
        line.textContent = player.name + (player.isBot ? " (Bot)" : "");
        ui.lobbyPlayers.appendChild(line);
      });
      ui.startOnline.disabled = !isHost;
      ui.addBot.disabled = !isHost;
      ui.hostHint.textContent = isHost ? "You are the host." : "Waiting for host.";
    }
    if (message.type === "game_state") {
      onlineState = message.state;
      notice = null;
      ui.setupPanel.classList.add("hidden");
      render();
    }
    if (message.type === "error") showNotice(message.message);
  });

  socket.addEventListener("close", () => { setStatus("Offline"); isHost = false; });
}

function leaveRoom() {
  if (socket) { socket.send(JSON.stringify({ type: "leave" })); socket.close(); }
  socket = null;
  onlineState = null;
  ui.onlineLobby.classList.add("hidden");
  setStatus("Offline");
}

// ================================================
// Event Listeners
// ================================================
// Mode toggle (local/online)
const setupModeBtns = ui.setupPanel.querySelectorAll(":scope > .mode-toggle .mode-btn");
setupModeBtns.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

// Game mode toggle (alltime/current)
ui.gameModeBtns.forEach((button) => {
  button.addEventListener("click", () => {
    gameMode = button.dataset.gamemode;
    ui.gameModeBtns.forEach((b) => {
      const active = b.dataset.gamemode === gameMode;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
  });
});

ui.playerMinus.addEventListener("click", () => {
  const count = Math.max(1, Number(ui.playerCount.textContent) - 1);
  ui.playerCount.textContent = String(count);
});

ui.playerPlus.addEventListener("click", () => {
  const count = Math.min(3, Number(ui.playerCount.textContent) + 1);
  ui.playerCount.textContent = String(count);
});

ui.startLocal.addEventListener("click", startLocalGame);
ui.createRoom.addEventListener("click", () => connectOnline({ create: true }));
ui.joinRoom.addEventListener("click", () => connectOnline({ create: false }));

ui.copyRoom.addEventListener("click", () => {
  if (roomCode) { navigator.clipboard?.writeText(roomCode); showNotice("Room code copied."); }
});

ui.shareLan.addEventListener("click", () => {
  if (roomCode) {
    const url = window.location.origin + window.location.pathname + "?room=" + roomCode;
    navigator.clipboard?.writeText(url);
    showNotice("LAN Game Link copied!");
  }
});

ui.addBot.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "add_bot" }));
});

ui.startOnline.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "start_game" }));
});

ui.leaveRoom.addEventListener("click", leaveRoom);

ui.nextRoundBtn.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "revealing") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;
  dispatchAction({ type: "draw_card", playerId: viewingId });
});

const statBtns = ui.statButtons.querySelectorAll(".stat-btn");
for (const btn of statBtns) {
  btn.addEventListener("click", () => {
    const state = currentState();
    if (!state || state.phase !== "picking") return;
    const viewingId = currentViewingPlayerId(state);
    if (!viewingId) return;
    dispatchAction({ type: "pick_stat", playerId: viewingId, stat: btn.dataset.stat });
  });
}

ui.autoPlayToggle.addEventListener("click", () => {
  autoPlay = !autoPlay;
  ui.autoPlayToggle.textContent = autoPlay ? "Auto Play: On" : "Auto Play: Off";
  if (autoPlay && mode === "local" && localState && localState.phase === "picking") {
    const cp = localState.players[localState.currentPlayerIndex];
    const viewingId = currentViewingPlayerId(localState);
    if (cp && cp.id === viewingId) {
      if (revealTimeout) clearTimeout(revealTimeout);
      revealTimeout = setTimeout(() => {
        if (!localState || localState.phase !== "picking") return;
        const idx = localState.players.findIndex((p) => p.id === viewingId);
        if (idx >= 0) {
          const botAction = getBotMove(localState, idx);
          if (botAction) dispatchAction(botAction);
        }
      }, 600);
    }
  }
});

ui.restartLocal.addEventListener("click", resetToSetup);
ui.winnerNewGame.addEventListener("click", resetToSetup);

ui.toggleLogs.addEventListener("click", () => {
  ui.sidebar.classList.toggle("open");
  document.querySelector(".football-app").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".football-app").classList.remove("sidebar-open");
});

// Auto-fill room from URL
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get("room");
if (roomParam) {
  ui.roomCode.value = roomParam.toUpperCase();
  setMode("online");
}

// Initialize
setMode("local");
