import {
  applyAction,
  createGame,
  getBotMove,
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
  gridSizeMinus: document.getElementById("gridSizeMinus"),
  gridSizePlus: document.getElementById("gridSizePlus"),
  gridSizeDisplay: document.getElementById("gridSizeDisplay"),
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
  scoreboard: document.getElementById("scoreboard"),
  boardContainer: document.getElementById("boardContainer"),
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
let botTimeout = null;
let gridSize = 4;

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
// Board Rendering
// ================================================
function renderBoard(state) {
  const container = ui.boardContainer;
  container.innerHTML = "";

  if (!state) return;

  const { gridRows, gridCols, drawnLines, boxes, players, currentPlayerIndex, phase } = state;
  const viewingPlayerId = currentViewingPlayerId(state);
  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === viewingPlayerId;
  const canDraw = isMyTurn && phase === "playing";

  // Calculate sizing
  const maxWidth = container.clientWidth || 600;
  const maxHeight = 500;
  const cellSize = Math.min(
    Math.floor((maxWidth - 40) / (gridCols + 0.5)),
    Math.floor((maxHeight - 40) / (gridRows + 0.5)),
    80
  );
  const dotSize = Math.max(10, Math.floor(cellSize * 0.16));
  const lineThickness = Math.max(4, Math.floor(cellSize * 0.08));
  const boardWidth = gridCols * cellSize + dotSize;
  const boardHeight = gridRows * cellSize + dotSize;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${boardWidth} ${boardHeight}`);
  svg.setAttribute("width", boardWidth);
  svg.setAttribute("height", boardHeight);
  svg.classList.add("board-svg");

  const halfDot = dotSize / 2;

  // Render claimed boxes
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const boxKey = `${r}:${c}`;
      if (boxes[boxKey] !== undefined) {
        const pIdx = boxes[boxKey];
        const color = players[pIdx]?.color || "#555";
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", halfDot + c * cellSize + lineThickness / 2);
        rect.setAttribute("y", halfDot + r * cellSize + lineThickness / 2);
        rect.setAttribute("width", cellSize - lineThickness);
        rect.setAttribute("height", cellSize - lineThickness);
        rect.setAttribute("fill", color);
        rect.setAttribute("opacity", "0.2");
        rect.setAttribute("rx", "4");
        svg.appendChild(rect);

        // Player initial in the box
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", halfDot + c * cellSize + cellSize / 2);
        text.setAttribute("y", halfDot + r * cellSize + cellSize / 2 + 1);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("fill", color);
        text.setAttribute("font-size", Math.floor(cellSize * 0.32));
        text.setAttribute("font-weight", "800");
        text.setAttribute("opacity", "0.7");
        text.textContent = players[pIdx]?.name?.charAt(0)?.toUpperCase() || "?";
        svg.appendChild(text);
      }
    }
  }

  // Render horizontal lines
  for (let r = 0; r <= gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const key = `h:${r}:${c}`;
      const drawn = drawnLines[key] !== undefined;
      const x1 = halfDot + c * cellSize;
      const y = halfDot + r * cellSize;
      const x2 = halfDot + (c + 1) * cellSize;

      if (drawn) {
        const pIdx = drawnLines[key];
        const color = players[pIdx]?.color || "#888";
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", lineThickness);
        line.setAttribute("stroke-linecap", "round");
        svg.appendChild(line);
      } else if (canDraw) {
        // Clickable area for undrawn line
        const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "line");
        hitArea.setAttribute("x1", x1);
        hitArea.setAttribute("y1", y);
        hitArea.setAttribute("x2", x2);
        hitArea.setAttribute("y2", y);
        hitArea.setAttribute("stroke", "rgba(255,255,255,0.08)");
        hitArea.setAttribute("stroke-width", Math.max(lineThickness * 2.5, 16));
        hitArea.setAttribute("stroke-linecap", "round");
        hitArea.setAttribute("cursor", "pointer");
        hitArea.classList.add("line-hitarea");
        hitArea.dataset.line = key;
        hitArea.addEventListener("click", () => handleLineClick(key));
        hitArea.addEventListener("mouseenter", () => {
          hitArea.setAttribute("stroke", "rgba(255,255,255,0.25)");
        });
        hitArea.addEventListener("mouseleave", () => {
          hitArea.setAttribute("stroke", "rgba(255,255,255,0.08)");
        });
        svg.appendChild(hitArea);
      }
    }
  }

  // Render vertical lines
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c <= gridCols; c++) {
      const key = `v:${r}:${c}`;
      const drawn = drawnLines[key] !== undefined;
      const x = halfDot + c * cellSize;
      const y1 = halfDot + r * cellSize;
      const y2 = halfDot + (r + 1) * cellSize;

      if (drawn) {
        const pIdx = drawnLines[key];
        const color = players[pIdx]?.color || "#888";
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", lineThickness);
        line.setAttribute("stroke-linecap", "round");
        svg.appendChild(line);
      } else if (canDraw) {
        const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "line");
        hitArea.setAttribute("x1", x);
        hitArea.setAttribute("y1", y1);
        hitArea.setAttribute("x2", x);
        hitArea.setAttribute("y2", y2);
        hitArea.setAttribute("stroke", "rgba(255,255,255,0.08)");
        hitArea.setAttribute("stroke-width", Math.max(lineThickness * 2.5, 16));
        hitArea.setAttribute("stroke-linecap", "round");
        hitArea.setAttribute("cursor", "pointer");
        hitArea.classList.add("line-hitarea");
        hitArea.dataset.line = key;
        hitArea.addEventListener("click", () => handleLineClick(key));
        hitArea.addEventListener("mouseenter", () => {
          hitArea.setAttribute("stroke", "rgba(255,255,255,0.25)");
        });
        hitArea.addEventListener("mouseleave", () => {
          hitArea.setAttribute("stroke", "rgba(255,255,255,0.08)");
        });
        svg.appendChild(hitArea);
      }
    }
  }

  // Render dots (on top of everything)
  for (let r = 0; r <= gridRows; r++) {
    for (let c = 0; c <= gridCols; c++) {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", halfDot + c * cellSize);
      dot.setAttribute("cy", halfDot + r * cellSize);
      dot.setAttribute("r", dotSize / 2);
      dot.setAttribute("fill", "#e0e0e0");
      svg.appendChild(dot);
    }
  }

  container.appendChild(svg);
}

function handleLineClick(lineKey) {
  const state = currentState();
  if (!state || state.phase !== "playing") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;
  dispatchAction({ type: "draw_line", playerId: viewingId, line: lineKey });
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

  // Turn info
  ui.turnName.textContent = isMyTurn ? "Your Turn" : `${currentPlayer?.name || "?"}'s Turn`;
  ui.turnCard.classList.toggle("my-turn", isMyTurn);
  ui.turnCard.style.setProperty("--turn-color", currentPlayer?.color || "#0a84ff");

  if (notice) {
    ui.turnHint.textContent = notice;
  } else if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.turnHint.textContent = winner ? `${winner.name} wins with ${winner.score} boxes!` : "Game over.";
  } else if (state.phase === "playing" && isMyTurn) {
    ui.turnHint.textContent = "Click a line between two dots";
  } else if (state.phase === "playing") {
    ui.turnHint.textContent = `Waiting for ${currentPlayer?.name}...`;
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

  // Scoreboard
  ui.scoreboard.innerHTML = "";
  for (const p of state.players) {
    const el = document.createElement("div");
    el.className = "score-card";
    if (p.id === currentPlayer?.id && state.phase === "playing") el.classList.add("active");

    const dot = document.createElement("div");
    dot.className = "score-dot";
    dot.style.background = p.color;

    const info = document.createElement("div");
    const nameEl = document.createElement("div");
    nameEl.className = "score-name";
    nameEl.textContent = p.name;
    const countEl = document.createElement("div");
    countEl.className = "score-count";
    countEl.textContent = `${p.score} box${p.score !== 1 ? "es" : ""}`;

    info.appendChild(nameEl);
    info.appendChild(countEl);
    el.appendChild(dot);
    el.appendChild(info);
    ui.scoreboard.appendChild(el);
  }

  // Board
  renderBoard(state);

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
    if (cp && cp.isBot) {
      if (botTimeout) clearTimeout(botTimeout);
      botTimeout = setTimeout(() => {
        if (!localState || localState.phase !== "playing") return;
        const botAction = getBotMove(localState, localState.currentPlayerIndex);
        if (botAction) dispatchAction(botAction);
      }, 600);
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
  const name = document.getElementById("localName").value.trim() || "Player";
  const botCount = Number(ui.playerCount.textContent);
  const isSpectator = ui.localSpectator.checked;

  const botNames = ["Alpha", "Beta", "Gamma"];
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
  localState = createGame({ players, options: { gridRows: gridSize, gridCols: gridSize } });
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
        gameType: "dots-and-boxes",
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
  const count = Math.min(3, Number(ui.playerCount.textContent) + 1);
  ui.playerCount.textContent = String(count);
});

ui.gridSizeMinus.addEventListener("click", () => {
  gridSize = Math.max(2, gridSize - 1);
  ui.gridSizeDisplay.textContent = `${gridSize}x${gridSize}`;
});

ui.gridSizePlus.addEventListener("click", () => {
  gridSize = Math.min(8, gridSize + 1);
  ui.gridSizeDisplay.textContent = `${gridSize}x${gridSize}`;
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

ui.restartLocal.addEventListener("click", resetToSetup);
ui.winnerNewGame.addEventListener("click", resetToSetup);

// Sidebar
ui.toggleLogs.addEventListener("click", () => {
  ui.sidebar.classList.toggle("open");
  document.querySelector(".dots-app").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".dots-app").classList.remove("sidebar-open");
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
