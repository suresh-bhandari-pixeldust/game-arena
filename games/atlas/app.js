import {
  applyAction,
  createGame,
  getBotMove,
  isValidPlace,
  getLastLetter,
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
  turnCard: document.getElementById("turnCard"),
  turnName: document.getElementById("turnName"),
  turnHint: document.getElementById("turnHint"),
  restartLocal: document.getElementById("restartLocal"),
  opponentsRow: document.getElementById("opponentsRow"),
  lastPlaceDisplay: document.getElementById("lastPlaceDisplay"),
  lastPlaceName: document.getElementById("lastPlaceName"),
  requiredLetter: document.getElementById("requiredLetter"),
  wordInput: document.getElementById("wordInput"),
  submitWord: document.getElementById("submitWord"),
  passBtn: document.getElementById("passBtn"),
  timerDisplay: document.getElementById("timerDisplay"),
  timerFill: document.getElementById("timerFill"),
  wordChain: document.getElementById("wordChain"),
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
let timerInterval = null;
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
  }, 3000);
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
// Timer
// ================================================
function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    const state = currentState();
    if (!state || state.phase !== "playing") {
      stopTimer();
      return;
    }
    const elapsed = (Date.now() - state.timerStartedAt) / 1000;
    const remaining = Math.max(0, 30 - elapsed);
    ui.timerDisplay.textContent = Math.ceil(remaining);
    ui.timerFill.style.width = `${(remaining / 30) * 100}%`;

    if (remaining <= 5) {
      ui.timerFill.classList.add("danger");
    } else {
      ui.timerFill.classList.remove("danger");
    }

    if (remaining <= 0) {
      stopTimer();
      // Auto-eliminate current player
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (currentPlayer && !currentPlayer.eliminated) {
        dispatchAction({ type: "timeout", playerId: currentPlayer.id });
      }
    }
  }, 200);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
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
  const isMyTurn = currentPlayer && currentPlayer.id === viewingPlayerId && !currentPlayer.eliminated;
  const me = state.players.find((p) => p.id === viewingPlayerId);

  // Turn info
  if (state.phase === "finished") {
    ui.turnName.textContent = "Game Over";
    ui.turnCard.classList.remove("my-turn");
  } else if (isMyTurn) {
    ui.turnName.textContent = "Your Turn";
    ui.turnCard.classList.add("my-turn");
  } else {
    ui.turnName.textContent = `${currentPlayer?.name || "?"}'s Turn`;
    ui.turnCard.classList.remove("my-turn");
  }

  if (notice) {
    ui.turnHint.textContent = notice;
  } else if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.turnHint.textContent = winner ? `${winner.name} is the champion!` : "Game over.";
  } else if (state.phase === "playing" && isMyTurn) {
    if (state.requiredLetter) {
      ui.turnHint.textContent = `Name a place starting with "${state.requiredLetter.toUpperCase()}"`;
    } else {
      ui.turnHint.textContent = "Name any place to begin!";
    }
  } else if (state.phase === "playing") {
    ui.turnHint.textContent = `Waiting for ${currentPlayer?.name} to answer...`;
  } else {
    ui.turnHint.textContent = "Waiting...";
  }

  // Winner banner
  if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.winnerBanner.classList.remove("hidden");
    ui.winnerName.textContent = `${winner?.name || "Someone"} Wins!`;
  } else {
    ui.winnerBanner.classList.add("hidden");
  }

  // Last place and required letter
  if (state.lastPlace) {
    ui.lastPlaceDisplay.classList.remove("hidden");
    ui.lastPlaceName.textContent = state.lastPlace;
    const lastChar = state.requiredLetter ? state.requiredLetter.toUpperCase() : "?";
    ui.requiredLetter.textContent = lastChar;
  } else {
    ui.lastPlaceDisplay.classList.remove("hidden");
    ui.lastPlaceName.textContent = "First turn - any place!";
    ui.requiredLetter.textContent = "?";
  }

  // Opponents / players row
  ui.opponentsRow.innerHTML = "";
  for (const p of state.players) {
    const el = document.createElement("div");
    el.className = "opponent-card";
    if (p.id === currentPlayer?.id && !p.eliminated) el.classList.add("active");
    if (p.eliminated) el.classList.add("eliminated");
    if (p.id === viewingPlayerId) el.classList.add("is-me");

    const avatar = document.createElement("div");
    avatar.className = "opp-avatar";
    avatar.textContent = p.name.charAt(0).toUpperCase();

    const info = document.createElement("div");
    const nameEl = document.createElement("div");
    nameEl.className = "opp-name";
    nameEl.textContent = p.name;
    const countEl = document.createElement("div");
    countEl.className = "opp-count";
    countEl.textContent = p.eliminated ? "Eliminated" : `${p.score} place${p.score !== 1 ? "s" : ""}`;

    info.appendChild(nameEl);
    info.appendChild(countEl);
    el.appendChild(avatar);
    el.appendChild(info);
    ui.opponentsRow.appendChild(el);
  }

  // Input area
  const canSubmit = isMyTurn && state.phase === "playing";
  ui.wordInput.disabled = !canSubmit;
  ui.submitWord.disabled = !canSubmit;
  ui.passBtn.disabled = !canSubmit;

  if (canSubmit) {
    ui.wordInput.placeholder = state.requiredLetter
      ? `Place starting with "${state.requiredLetter.toUpperCase()}"...`
      : "Name any place...";
  } else {
    ui.wordInput.placeholder = "Waiting...";
  }

  // Word chain display
  ui.wordChain.innerHTML = "";
  // Show last 12 places in reverse (most recent first)
  const recentPlaces = [...state.usedPlaces].reverse().slice(0, 12);
  for (const place of recentPlaces) {
    const chip = document.createElement("span");
    chip.className = "chain-chip";
    // Find canonical name
    const displayName = place.charAt(0).toUpperCase() + place.slice(1);
    chip.textContent = displayName;

    // Highlight first and last letters
    const firstLetter = document.createElement("span");
    firstLetter.className = "chain-first";
    firstLetter.textContent = displayName[0];
    const lastLetter = document.createElement("span");
    lastLetter.className = "chain-last";
    lastLetter.textContent = displayName[displayName.length - 1];

    chip.textContent = "";
    chip.appendChild(firstLetter);
    chip.appendChild(document.createTextNode(displayName.slice(1, -1)));
    if (displayName.length > 1) chip.appendChild(lastLetter);

    ui.wordChain.appendChild(chip);
  }

  // Timer
  if (state.phase === "playing") {
    const elapsed = (Date.now() - state.timerStartedAt) / 1000;
    const remaining = Math.max(0, 30 - elapsed);
    ui.timerDisplay.textContent = Math.ceil(remaining);
    ui.timerFill.style.width = `${(remaining / 30) * 100}%`;
    startTimer();
  } else {
    stopTimer();
    ui.timerDisplay.textContent = "--";
    ui.timerFill.style.width = "0%";
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
  if (mode === "local" && state.phase === "playing") {
    const cp = state.players[state.currentPlayerIndex];
    if (cp && cp.isBot && !cp.eliminated) {
      if (botTimeout) clearTimeout(botTimeout);
      const delay = 1500 + Math.random() * 2000; // 1.5-3.5s thinking time
      botTimeout = setTimeout(() => {
        if (!localState || localState.phase !== "playing") return;
        const botAction = getBotMove(localState, localState.currentPlayerIndex);
        if (botAction) dispatchAction(botAction);
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
  const name = document.getElementById("localName").value.trim() || "Explorer";
  const botCount = Number(ui.playerCount.textContent);
  const isSpectator = ui.localSpectator.checked;

  const botNames = [
    "Atlas Bot", "Globe Trotter", "Navigator", "Cartographer",
    "Voyager", "Compass", "Meridian", "Pathfinder",
  ];

  const players = [];
  if (!isSpectator) {
    players.push({ id: "p1", name, isBot: false });
  }

  for (let i = 0; i < botCount; i += 1) {
    const botName = botNames[i % botNames.length];
    players.push({ id: `bot${i + 1}`, name: botName, isBot: true });
  }

  // Must have at least 2 players
  if (players.length < 2) {
    const extra = botNames[players.length % botNames.length];
    players.push({ id: "bot_extra", name: extra, isBot: true });
  }

  notice = null;
  localState = createGame({ players });
  myPlayerId = isSpectator ? null : "p1";
  setStatus(isSpectator ? "Spectating" : "Single Player");
  ui.setupPanel.classList.add("hidden");
  ui.wordInput.value = "";
  render();
}

function resetToSetup() {
  if (botTimeout) clearTimeout(botTimeout);
  stopTimer();
  clearNotice();
  localState = null;
  onlineState = null;
  notice = null;
  ui.setupPanel.classList.remove("hidden");
  ui.gamePanel.classList.add("hidden");
  ui.winnerBanner.classList.add("hidden");
  ui.toast.classList.remove("visible");
}

// ================================================
// Online Mode
// ================================================
function connectOnline({ create }) {
  const name = ui.onlineName.value.trim() || "Explorer";
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
        gameType: "atlas",
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

ui.playerMinus.addEventListener("click", () => {
  const count = Math.max(1, Number(ui.playerCount.textContent) - 1);
  ui.playerCount.textContent = String(count);
});

ui.playerPlus.addEventListener("click", () => {
  const count = Math.min(7, Number(ui.playerCount.textContent) + 1);
  ui.playerCount.textContent = String(count);
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

// Submit word
ui.submitWord.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "playing") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;
  const word = ui.wordInput.value.trim();
  if (!word) return;
  dispatchAction({ type: "submit_word", playerId: viewingId, word });
  ui.wordInput.value = "";
});

// Enter key submits
ui.wordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    ui.submitWord.click();
  }
});

// Pass button
ui.passBtn.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "playing") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;
  dispatchAction({ type: "pass", playerId: viewingId });
});

ui.restartLocal.addEventListener("click", resetToSetup);
ui.winnerNewGame.addEventListener("click", resetToSetup);

// Sidebar
ui.toggleLogs.addEventListener("click", () => {
  ui.sidebar.classList.toggle("open");
  document.querySelector(".atlas-app").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".atlas-app").classList.remove("sidebar-open");
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
