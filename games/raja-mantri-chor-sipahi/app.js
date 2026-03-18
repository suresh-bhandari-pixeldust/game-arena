import {
  applyAction,
  createGame,
  getBotMove,
  ROLES,
  ROLE_INFO,
} from "./game.js";

// ================================================
// DOM References
// ================================================
const ui = {
  connectionStatus: document.getElementById("connectionStatus"),
  setupPanel: document.getElementById("setupPanel"),
  localSetup: document.getElementById("localSetup"),
  onlineSetup: document.getElementById("onlineSetup"),
  modeButtons: document.querySelectorAll(".mode-btn"),
  startLocal: document.getElementById("startLocal"),
  roundsCount: document.getElementById("roundsCount"),
  roundsMinus: document.getElementById("roundsMinus"),
  roundsPlus: document.getElementById("roundsPlus"),
  localSpectator: document.getElementById("localSpectator"),
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
  turnCard: document.getElementById("turnCard"),
  turnName: document.getElementById("turnName"),
  turnHint: document.getElementById("turnHint"),
  autoPlayToggle: document.getElementById("autoPlayToggle"),
  restartLocal: document.getElementById("restartLocal"),
  roundInfo: document.getElementById("roundInfo"),
  roundNumber: document.getElementById("roundNumber"),
  scoreboard: document.getElementById("scoreboard"),
  roleArea: document.getElementById("roleArea"),
  roleTitle: document.getElementById("roleTitle"),
  roleContent: document.getElementById("roleContent"),
  actionArea: document.getElementById("actionArea"),
  actionTitle: document.getElementById("actionTitle"),
  actionContent: document.getElementById("actionContent"),
  resultsArea: document.getElementById("resultsArea"),
  resultsTitle: document.getElementById("resultsTitle"),
  resultsContent: document.getElementById("resultsContent"),
  nextRoundBtn: document.getElementById("nextRoundBtn"),
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
let localState = null;
let onlineState = null;
let myPlayerId = null;
let socket = null;
let roomCode = null;
let isHost = false;
let notice = null;
let noticeTimeout = null;
let autoPlay = false;
let botTimeout = null;

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
  for (let i = 0; i < 5; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function setStatus(text) {
  ui.connectionStatus.textContent = text;
}

function setMode(nextMode) {
  mode = nextMode;
  ui.modeButtons.forEach((button) => {
    const active = button.dataset.mode === nextMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  ui.localSetup.classList.toggle("hidden", nextMode !== "local");
  ui.onlineSetup.classList.toggle("hidden", nextMode !== "online");
  ui.restartLocal.classList.toggle("hidden", nextMode !== "local");
  setStatus(nextMode === "local" ? "Local" : "Offline");
}

function currentState() {
  return mode === "online" ? onlineState : localState;
}

function currentViewingPlayerId(state) {
  if (!state) return null;
  if (mode === "online") return myPlayerId;
  const human = state.players.find((p) => !p.isBot);
  return human ? human.id : null;
}

// ================================================
// Role SVG Icons
// ================================================
function getRoleIcon(role) {
  const icons = {
    Raja: `<svg viewBox="0 0 60 60" fill="none"><path d="M10 40 L15 20 L22 30 L30 10 L38 30 L45 20 L50 40Z" fill="#d4af37" opacity="0.8"/><rect x="8" y="40" width="44" height="8" rx="2" fill="#d4af37" opacity="0.6"/><circle cx="30" cy="18" r="4" fill="#fff" opacity="0.5"/><circle cx="18" cy="26" r="2.5" fill="#e74c3c" opacity="0.6"/><circle cx="42" cy="26" r="2.5" fill="#3498db" opacity="0.6"/></svg>`,
    Mantri: `<svg viewBox="0 0 60 60" fill="none"><rect x="12" y="10" width="36" height="44" rx="3" fill="#9b59b6" opacity="0.3"/><rect x="16" y="14" width="28" height="36" rx="2" fill="#9b59b6" opacity="0.2"/><line x1="20" y1="22" x2="40" y2="22" stroke="#9b59b6" stroke-width="2" opacity="0.5"/><line x1="20" y1="28" x2="40" y2="28" stroke="#9b59b6" stroke-width="2" opacity="0.4"/><line x1="20" y1="34" x2="35" y2="34" stroke="#9b59b6" stroke-width="2" opacity="0.3"/><circle cx="44" cy="12" r="6" fill="#d4af37" opacity="0.4"/></svg>`,
    Chor: `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="20" r="10" fill="#e74c3c" opacity="0.3"/><path d="M20 18 Q30 12 40 18" fill="#1a1a1a" opacity="0.7"/><rect x="22" y="18" width="6" height="4" rx="2" fill="#fff" opacity="0.5"/><rect x="32" y="18" width="6" height="4" rx="2" fill="#fff" opacity="0.5"/><rect x="24" y="32" width="12" height="20" rx="3" fill="#e74c3c" opacity="0.2"/><path d="M18 38 L14 50" stroke="#e74c3c" stroke-width="2" opacity="0.3"/><path d="M42 38 L46 50" stroke="#e74c3c" stroke-width="2" opacity="0.3"/></svg>`,
    Sipahi: `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="18" r="9" fill="#3498db" opacity="0.3"/><rect x="22" y="28" width="16" height="22" rx="3" fill="#3498db" opacity="0.2"/><rect x="42" y="14" width="4" height="30" rx="2" fill="#8b7355" opacity="0.4"/><circle cx="44" cy="12" r="4" fill="#3498db" opacity="0.3"/><path d="M42 14 L48 10" stroke="#8b7355" stroke-width="2" opacity="0.4"/><rect x="26" y="50" width="4" height="8" rx="2" fill="#3498db" opacity="0.2"/><rect x="32" y="50" width="4" height="8" rx="2" fill="#3498db" opacity="0.2"/></svg>`,
  };
  return icons[role] || icons.Raja;
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
  const me = state.players.find((p) => p.id === viewingPlayerId);
  const myRole = me ? me.role : null;

  // Turn info
  if (state.phase === "raja_reveal") {
    const raja = state.players.find((p) => p.role === "Raja");
    const isMyAction = raja && raja.id === viewingPlayerId;
    ui.turnName.textContent = isMyAction ? "You are the Raja!" : "Who is the Raja?";
    ui.turnHint.textContent = isMyAction
      ? "Reveal yourself as the Raja"
      : "Waiting for the Raja to reveal...";
    ui.turnCard.classList.toggle("my-turn", isMyAction);
  } else if (state.phase === "guessing") {
    const mantri = state.players.find((p) => p.role === "Mantri");
    const isMyAction = mantri && mantri.id === viewingPlayerId;
    ui.turnName.textContent = isMyAction ? "You are the Mantri!" : `${mantri?.name || "Mantri"}'s Turn`;
    ui.turnHint.textContent = isMyAction
      ? "Identify the Chor among the remaining players"
      : "Waiting for the Mantri to identify the Chor...";
    ui.turnCard.classList.toggle("my-turn", isMyAction);
  } else if (state.phase === "results") {
    ui.turnName.textContent = "Round Complete";
    const correct = state.roundGuessCorrect;
    ui.turnHint.textContent = correct
      ? "The Mantri correctly identified the Chor!"
      : "The Mantri guessed wrong! The Chor gets the Mantri's points!";
    ui.turnCard.classList.remove("my-turn");
  } else if (state.phase === "finished") {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.turnName.textContent = "Game Over";
    ui.turnHint.textContent = winner ? `${winner.name} wins with ${winner.score} points!` : "Game over.";
    ui.turnCard.classList.remove("my-turn");
  } else {
    ui.turnName.textContent = "Dealing...";
    ui.turnHint.textContent = "Chits are being shuffled";
    ui.turnCard.classList.remove("my-turn");
  }

  // Round info
  ui.roundNumber.textContent = `Round ${state.round} of ${state.totalRounds}`;

  // Scoreboard
  ui.scoreboard.innerHTML = "";
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  for (const p of sortedPlayers) {
    const div = document.createElement("div");
    div.className = "score-row";
    if (p.id === viewingPlayerId) div.classList.add("is-me");
    if (state.phase === "finished" && p.id === state.winnerId) div.classList.add("is-winner");

    const avatar = document.createElement("div");
    avatar.className = "score-avatar";
    avatar.textContent = p.name.charAt(0).toUpperCase();

    const info = document.createElement("div");
    info.className = "score-info";

    const nameEl = document.createElement("div");
    nameEl.className = "score-name";
    nameEl.textContent = p.name;

    const roleEl = document.createElement("div");
    roleEl.className = "score-role";
    if (p.revealedRole && (state.phase === "results" || state.phase === "finished")) {
      roleEl.textContent = ROLE_INFO[p.revealedRole].label;
      roleEl.style.color = ROLE_INFO[p.revealedRole].color;
    } else if (p.revealedRole === "Raja") {
      roleEl.textContent = "Raja (King)";
      roleEl.style.color = ROLE_INFO.Raja.color;
    }

    info.appendChild(nameEl);
    info.appendChild(roleEl);

    const scoreEl = document.createElement("div");
    scoreEl.className = "score-points";
    scoreEl.textContent = String(p.score);

    div.appendChild(avatar);
    div.appendChild(info);
    div.appendChild(scoreEl);
    ui.scoreboard.appendChild(div);
  }

  // Role area - show your role
  ui.roleArea.classList.remove("hidden");
  ui.roleContent.innerHTML = "";

  if (me && myRole && state.phase !== "dealing") {
    ui.roleTitle.textContent = "Your Chit";
    const roleCard = document.createElement("div");
    roleCard.className = `role-card role-${myRole.toLowerCase()}`;

    const iconDiv = document.createElement("div");
    iconDiv.className = "role-icon";
    iconDiv.innerHTML = getRoleIcon(myRole);

    const labelDiv = document.createElement("div");
    labelDiv.className = "role-label";
    labelDiv.textContent = ROLE_INFO[myRole].label;

    const pointsDiv = document.createElement("div");
    pointsDiv.className = "role-points";
    if (myRole === "Raja") {
      pointsDiv.textContent = "Always gets 1000 pts";
    } else if (myRole === "Mantri") {
      pointsDiv.textContent = "800 pts if you identify the Chor";
    } else if (myRole === "Chor") {
      pointsDiv.textContent = "0 pts unless Mantri guesses wrong (then 800)";
    } else {
      pointsDiv.textContent = "500 pts if Mantri identifies the Chor";
    }

    roleCard.appendChild(iconDiv);
    roleCard.appendChild(labelDiv);
    roleCard.appendChild(pointsDiv);
    ui.roleContent.appendChild(roleCard);
  } else if (!me) {
    ui.roleTitle.textContent = "Spectating";
    const msg = document.createElement("div");
    msg.className = "spectator-msg";
    msg.textContent = "You are watching the game";
    ui.roleContent.appendChild(msg);
  } else {
    ui.roleTitle.textContent = "Your Chit";
    const msg = document.createElement("div");
    msg.className = "role-hidden-msg";
    msg.textContent = "Waiting for chits...";
    ui.roleContent.appendChild(msg);
  }

  // Action area
  ui.actionArea.classList.remove("hidden");
  ui.actionContent.innerHTML = "";

  if (state.phase === "raja_reveal") {
    ui.actionTitle.textContent = "Raja Reveal";
    if (me && myRole === "Raja") {
      const btn = document.createElement("button");
      btn.className = "primary reveal-btn";
      btn.textContent = "I am the Raja!";
      btn.addEventListener("click", () => {
        dispatchAction({ type: "reveal_raja", playerId: viewingPlayerId });
      });
      ui.actionContent.appendChild(btn);
    } else {
      const msg = document.createElement("div");
      msg.className = "waiting-msg";
      msg.textContent = "Waiting for the Raja to reveal themselves...";
      ui.actionContent.appendChild(msg);

      // Show chit animation
      const chitsRow = document.createElement("div");
      chitsRow.className = "chits-row";
      for (const p of state.players) {
        const chit = document.createElement("div");
        chit.className = "chit-card";
        if (p.revealedRole === "Raja") {
          chit.classList.add("revealed");
          chit.innerHTML = `<div class="chit-icon">${getRoleIcon("Raja")}</div><div class="chit-name">${p.name}</div><div class="chit-role">Raja</div>`;
        } else {
          chit.innerHTML = `<div class="chit-back">?</div><div class="chit-name">${p.name}</div>`;
        }
        chitsRow.appendChild(chit);
      }
      ui.actionContent.appendChild(chitsRow);
    }
  } else if (state.phase === "guessing") {
    ui.actionTitle.textContent = "Identify the Chor";
    const rajaPlayer = state.players.find((p) => p.revealedRole === "Raja");

    if (me && myRole === "Mantri") {
      const hint = document.createElement("div");
      hint.className = "guess-hint";
      hint.textContent = "Who is the Chor? Choose wisely!";
      ui.actionContent.appendChild(hint);

      const guessRow = document.createElement("div");
      guessRow.className = "guess-row";

      for (const p of state.players) {
        if (p.revealedRole === "Raja" || p.id === me.id) continue;
        const btn = document.createElement("button");
        btn.className = "guess-btn";
        btn.innerHTML = `<span class="guess-avatar">${p.name.charAt(0)}</span><span class="guess-name">${p.name}</span>`;
        btn.addEventListener("click", () => {
          dispatchAction({ type: "guess_chor", playerId: viewingPlayerId, targetId: p.id });
        });
        guessRow.appendChild(btn);
      }
      ui.actionContent.appendChild(guessRow);
    } else {
      const msg = document.createElement("div");
      msg.className = "waiting-msg";
      const mantri = state.players.find((p) => p.role === "Mantri");
      msg.textContent = `Waiting for ${mantri?.name || "the Mantri"} to identify the Chor...`;
      ui.actionContent.appendChild(msg);

      // Show player cards with Raja revealed
      const chitsRow = document.createElement("div");
      chitsRow.className = "chits-row";
      for (const p of state.players) {
        const chit = document.createElement("div");
        chit.className = "chit-card";
        if (p.revealedRole === "Raja") {
          chit.classList.add("revealed");
          chit.innerHTML = `<div class="chit-icon">${getRoleIcon("Raja")}</div><div class="chit-name">${p.name}</div><div class="chit-role">Raja</div>`;
        } else {
          chit.innerHTML = `<div class="chit-back">?</div><div class="chit-name">${p.name}</div>`;
        }
        chitsRow.appendChild(chit);
      }
      ui.actionContent.appendChild(chitsRow);
    }
  } else if (state.phase === "results" || state.phase === "finished") {
    ui.actionTitle.textContent = "Round Results";

    const chitsRow = document.createElement("div");
    chitsRow.className = "chits-row revealed-all";
    for (const p of state.players) {
      const chit = document.createElement("div");
      chit.className = `chit-card revealed role-${(p.revealedRole || p.role || "").toLowerCase()}`;

      const role = p.revealedRole || p.role;
      const info = ROLE_INFO[role] || ROLE_INFO.Chor;
      const roundPoints = role === "Raja" ? 1000
        : role === "Mantri" ? (state.roundGuessCorrect ? 800 : 0)
        : role === "Chor" ? (state.roundGuessCorrect ? 0 : 800)
        : role === "Sipahi" ? (state.roundGuessCorrect ? 500 : 0)
        : 0;

      chit.innerHTML = `
        <div class="chit-icon">${getRoleIcon(role)}</div>
        <div class="chit-name">${p.name}</div>
        <div class="chit-role" style="color:${info.color}">${info.label}</div>
        <div class="chit-points">+${roundPoints}</div>
      `;
      chitsRow.appendChild(chit);
    }
    ui.actionContent.appendChild(chitsRow);

    // Guess result banner
    const banner = document.createElement("div");
    banner.className = `guess-result ${state.roundGuessCorrect ? "correct" : "incorrect"}`;
    banner.textContent = state.roundGuessCorrect
      ? "Mantri guessed correctly!"
      : "Mantri guessed wrong! Chor steals the points!";
    ui.actionContent.appendChild(banner);
  } else {
    ui.actionArea.classList.add("hidden");
  }

  // Next round button
  if (state.phase === "results") {
    ui.nextRoundBtn.classList.remove("hidden");
    ui.nextRoundBtn.disabled = false;
  } else {
    ui.nextRoundBtn.classList.add("hidden");
  }

  // Winner banner
  if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.winnerBanner.classList.remove("hidden");
    ui.winnerName.textContent = `${winner?.name || "Someone"} Wins!`;
  } else {
    ui.winnerBanner.classList.add("hidden");
  }

  // Logs sidebar
  ui.sidebarLogs.innerHTML = "";
  (state.log || []).forEach((entry) => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.textContent = entry;
    ui.sidebarLogs.appendChild(div);
  });

  // Bot automation
  if (mode === "local" && state.phase !== "finished") {
    scheduleBotMoves(state);
  }
}

function scheduleBotMoves(state) {
  if (botTimeout) clearTimeout(botTimeout);

  // Check if any bot has an action to take
  const needsBot = state.players.some((p, i) => {
    if (!p.isBot) return false;
    const move = getBotMove(state, i);
    return move !== null;
  });

  // Also auto-play for human if autoPlay is on
  const viewingPlayerId = currentViewingPlayerId(state);
  const needsAutoPlay = autoPlay && viewingPlayerId && state.players.some((p, i) => {
    if (p.id !== viewingPlayerId) return false;
    const move = getBotMove(state, i);
    return move !== null;
  });

  if (needsBot || needsAutoPlay) {
    const delay = state.phase === "results" ? 2500 : 1500;
    botTimeout = setTimeout(() => {
      if (!localState) return;
      for (let i = 0; i < localState.players.length; i += 1) {
        const p = localState.players[i];
        if (p.isBot || (autoPlay && p.id === viewingPlayerId)) {
          const move = getBotMove(localState, i);
          if (move) {
            dispatchAction(move);
            return;
          }
        }
      }
    }, delay);
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
    showNotice("Start a game first.");
    return;
  }

  if (botTimeout) clearTimeout(botTimeout);
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
  const name = document.getElementById("localName").value.trim() || "Player";
  const totalRounds = Number(ui.roundsCount.textContent) || 5;
  const isSpectator = ui.localSpectator.checked;

  const botNames = ["Akbar", "Birbal", "Tenali", "Chanakya"];

  const players = [];
  if (!isSpectator) {
    players.push({ id: "p1", name, isBot: false });
  }

  // Fill remaining slots with bots (need exactly 4 players)
  const botsNeeded = 4 - players.length;
  for (let i = 0; i < botsNeeded; i += 1) {
    players.push({
      id: `bot${i + 1}`,
      name: `${botNames[i % botNames.length]} (Bot)`,
      isBot: true,
    });
  }

  notice = null;
  localState = createGame({ players, options: { totalRounds } });
  myPlayerId = isSpectator ? null : "p1";
  setStatus(isSpectator ? "Spectating" : "Single Player");
  ui.setupPanel.classList.add("hidden");
  render();
}

function resetToSetup() {
  if (botTimeout) clearTimeout(botTimeout);
  clearNotice();
  localState = null;
  onlineState = null;
  notice = null;
  autoPlay = false;
  ui.autoPlayToggle.textContent = "Auto Play: Off";
  ui.setupPanel.classList.remove("hidden");
  ui.gamePanel.classList.add("hidden");
  ui.winnerBanner.classList.add("hidden");
  ui.toast.classList.remove("visible");
}

// ================================================
// Online Mode
// ================================================
function connectOnline({ create }) {
  const name = ui.onlineName.value.trim() || "Player";
  const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
  const url = ui.serverUrl.value.trim() || `${wsProtocol}//${location.host}`;
  const rawCode = ui.roomCode.value.trim();
  if (!create && !rawCode) {
    showNotice("Enter a room code to join.");
    return;
  }
  const code = (rawCode || generateRoomCode()).toUpperCase();
  roomCode = code;
  ui.roomCode.value = code;
  if (socket) socket.close();
  socket = new WebSocket(url);
  setStatus("Connecting...");

  socket.addEventListener("open", () => {
    socket.send(
      JSON.stringify({
        type: "hello",
        name,
        room: code,
        create,
        gameType: "raja-mantri-chor-sipahi",
      })
    );
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "welcome") {
      myPlayerId = message.playerId;
      setStatus("Connected");
    }
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
      ui.hostHint.textContent = isHost
        ? "You are the host. Start when everyone is ready."
        : "Waiting for the host to start.";
    }
    if (message.type === "game_state") {
      onlineState = message.state;
      notice = null;
      ui.setupPanel.classList.add("hidden");
      render();
    }
    if (message.type === "error") showNotice(message.message);
  });

  socket.addEventListener("close", () => {
    setStatus("Offline");
    isHost = false;
  });
}

function leaveRoom() {
  if (socket) {
    socket.send(JSON.stringify({ type: "leave" }));
    socket.close();
  }
  socket = null;
  onlineState = null;
  ui.onlineLobby.classList.add("hidden");
  setStatus("Offline");
}

// ================================================
// Event Listeners
// ================================================
ui.modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

ui.roundsMinus.addEventListener("click", () => {
  const count = Math.max(1, Number(ui.roundsCount.textContent) - 1);
  ui.roundsCount.textContent = String(count);
});

ui.roundsPlus.addEventListener("click", () => {
  const count = Math.min(20, Number(ui.roundsCount.textContent) + 1);
  ui.roundsCount.textContent = String(count);
});

ui.startLocal.addEventListener("click", startLocalGame);

ui.createRoom.addEventListener("click", () => connectOnline({ create: true }));
ui.joinRoom.addEventListener("click", () => connectOnline({ create: false }));

ui.copyRoom.addEventListener("click", () => {
  if (roomCode) {
    navigator.clipboard?.writeText(roomCode);
    showNotice("Room code copied.");
  }
});

ui.shareLan.addEventListener("click", () => {
  if (roomCode) {
    const url = window.location.origin + window.location.pathname + "?room=" + roomCode;
    navigator.clipboard?.writeText(url);
    showNotice("LAN Game Link copied!");
  }
});

ui.addBot.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "add_bot" }));
  }
});

ui.startOnline.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "start_game" }));
  }
});

ui.leaveRoom.addEventListener("click", leaveRoom);

ui.nextRoundBtn.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "results") return;
  const viewingId = currentViewingPlayerId(state);
  dispatchAction({ type: "next_round", playerId: viewingId || state.players[0].id });
});

ui.autoPlayToggle.addEventListener("click", () => {
  autoPlay = !autoPlay;
  ui.autoPlayToggle.textContent = autoPlay ? "Auto Play: On" : "Auto Play: Off";
  if (autoPlay && mode === "local" && localState) {
    render();
  }
});

ui.restartLocal.addEventListener("click", resetToSetup);
ui.winnerNewGame.addEventListener("click", resetToSetup);

// Sidebar
ui.toggleLogs.addEventListener("click", () => {
  ui.sidebar.classList.toggle("open");
  document.querySelector(".rmcs-app").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".rmcs-app").classList.remove("sidebar-open");
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
