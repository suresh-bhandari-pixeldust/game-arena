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
  variantButtons: document.querySelectorAll(".variant-btn"),
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
  autoPlayToggle: document.getElementById("autoPlayToggle"),
  restartLocal: document.getElementById("restartLocal"),
  playersBar: document.getElementById("playersBar"),
  boardContainer: document.getElementById("boardContainer"),
  sidebar: document.getElementById("sidebar"),
  sidebarLogs: document.getElementById("sidebarLogs"),
  toggleLogs: document.getElementById("toggleLogs"),
  closeSidebar: document.getElementById("closeSidebar"),
  toast: document.getElementById("toast"),
  winnerBanner: document.getElementById("winnerBanner"),
  winnerName: document.getElementById("winnerName"),
  winnerSubtext: document.getElementById("winnerSubtext"),
  winnerNewGame: document.getElementById("winnerNewGame"),
};

// ================================================
// State
// ================================================
let mode = "local";
let selectedVariant = "classic";
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
// SVG Mark Generators
// ================================================
function createXSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 60 60");
  svg.classList.add("mark-svg", "x-svg");

  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", "10"); line1.setAttribute("y1", "10");
  line1.setAttribute("x2", "50"); line1.setAttribute("y2", "50");

  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", "50"); line2.setAttribute("y1", "10");
  line2.setAttribute("x2", "10"); line2.setAttribute("y2", "50");

  svg.appendChild(line1);
  svg.appendChild(line2);
  return svg;
}

function createOSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 60 60");
  svg.classList.add("mark-svg", "o-svg");

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "30"); circle.setAttribute("cy", "30");
  circle.setAttribute("r", "20");

  svg.appendChild(circle);
  return svg;
}

// ================================================
// Rendering — Classic Board
// ================================================
function renderClassicBoard(state) {
  ui.boardContainer.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "classic-board";

  const viewingId = currentViewingPlayerId(state);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === viewingId;
  const isFinished = state.phase === "finished";

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const val = state.board[r][c];

      if (val) {
        cell.classList.add("taken");
        const svg = val === "X" ? createXSvg() : createOSvg();
        cell.appendChild(svg);
      }

      if (isFinished) {
        cell.classList.add("disabled");
      }

      // Check if this cell is in the winning line
      if (state.winningLine) {
        const isWinCell = state.winningLine.some((w) => w.row === r && w.col === c);
        if (isWinCell) cell.classList.add("winning");
      }

      if (!val && !isFinished && isMyTurn) {
        cell.addEventListener("click", () => {
          dispatchAction({
            type: "place_mark",
            playerId: viewingId,
            row: r,
            col: c,
          });
        });
      } else if (!val && !isFinished) {
        cell.classList.add("disabled");
      }

      grid.appendChild(cell);
    }
  }

  ui.boardContainer.appendChild(grid);
}

// ================================================
// Rendering — Super Board
// ================================================
function renderSuperBoard(state) {
  ui.boardContainer.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "super-board";

  const viewingId = currentViewingPlayerId(state);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === viewingId;
  const isFinished = state.phase === "finished";

  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const bigCell = document.createElement("div");
      bigCell.className = "big-cell";

      const metaVal = state.metaBoard[br][bc];
      const isDeclared = metaVal !== null;

      if (isDeclared) {
        bigCell.classList.add("decided");
        if (metaVal === "X") bigCell.classList.add("won-x");
        else if (metaVal === "O") bigCell.classList.add("won-o");
        else bigCell.classList.add("won-draw");

        // Overlay showing the big mark
        const overlay = document.createElement("div");
        overlay.className = "big-cell-overlay";
        const markEl = document.createElement("span");
        markEl.className = "big-mark";
        if (metaVal === "X") { markEl.classList.add("x"); markEl.textContent = "X"; }
        else if (metaVal === "O") { markEl.classList.add("o"); markEl.textContent = "O"; }
        else { markEl.classList.add("draw"); markEl.textContent = "DRAW"; }
        overlay.appendChild(markEl);
        bigCell.appendChild(overlay);
      }

      // Check if this big cell is a target
      const isTarget = !isFinished && !isDeclared && (
        state.nextBig === null ||
        (state.nextBig.row === br && state.nextBig.col === bc)
      );
      if (isTarget && !isFinished) bigCell.classList.add("active-target");

      // Check if this big cell is in the meta winning line
      if (state.winningLine && state.winningLine.meta) {
        const isMetaWin = state.winningLine.meta.some((w) => w.row === br && w.col === bc);
        if (isMetaWin) bigCell.classList.add("meta-winning");
      }

      // Render small cells
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const smallCell = document.createElement("div");
          smallCell.className = "small-cell";
          const val = state.boards[br][bc][r][c];

          if (val) {
            smallCell.classList.add("taken");
            const markSpan = document.createElement("span");
            markSpan.className = `mark ${val.toLowerCase()}`;
            markSpan.textContent = val;
            smallCell.appendChild(markSpan);
          }

          const canPlay = !val && !isDeclared && !isFinished && isMyTurn && isTarget;

          if (!canPlay) {
            if (!val && !isFinished) smallCell.classList.add("disabled");
          } else {
            smallCell.addEventListener("click", () => {
              dispatchAction({
                type: "place_mark",
                playerId: viewingId,
                bigRow: br,
                bigCol: bc,
                row: r,
                col: c,
              });
            });
          }

          bigCell.appendChild(smallCell);
        }
      }

      grid.appendChild(bigCell);
    }
  }

  ui.boardContainer.appendChild(grid);
}

// ================================================
// Main Render
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
  const markLabel = currentPlayer ? ` (${currentPlayer.mark})` : "";
  ui.turnCard.className = "turn-card";
  if (state.phase !== "finished") {
    ui.turnCard.classList.add(currentPlayer.mark === "X" ? "x-turn" : "o-turn");
  }

  if (isMyTurn && state.phase === "playing") {
    ui.turnName.textContent = `Your Turn${markLabel}`;
    ui.turnCard.classList.add("my-turn");
    ui.turnHint.textContent = state.variant === "super" && state.nextBig
      ? `Play in board (${state.nextBig.row + 1}, ${state.nextBig.col + 1})`
      : "Place your mark";
  } else if (state.phase === "playing") {
    ui.turnName.textContent = `${currentPlayer?.name || "?"}${markLabel}`;
    ui.turnHint.textContent = `Waiting for ${currentPlayer?.name}...`;
  } else if (state.phase === "finished") {
    if (state.isDraw || (!state.winnerId && state.phase === "finished")) {
      ui.turnName.textContent = "Draw!";
      ui.turnHint.textContent = "No one wins this round.";
    } else {
      const winner = state.players.find((p) => p.id === state.winnerId);
      ui.turnName.textContent = `${winner?.name || "?"} Wins!`;
      ui.turnHint.textContent = `${winner?.name} (${winner?.mark}) got three in a row!`;
    }
  }

  // Player badges
  ui.playersBar.innerHTML = "";
  for (const player of state.players) {
    const badge = document.createElement("div");
    badge.className = "player-badge";
    badge.classList.add(player.mark === "X" ? "x-player" : "o-player");
    if (state.phase === "playing" && player.id === currentPlayer?.id) {
      badge.classList.add("active");
    }

    const markEl = document.createElement("div");
    markEl.className = `badge-mark ${player.mark.toLowerCase()}`;
    markEl.textContent = player.mark;

    const info = document.createElement("div");
    const nameEl = document.createElement("div");
    nameEl.className = "badge-name";
    nameEl.textContent = player.name;
    const hintEl = document.createElement("div");
    hintEl.className = "badge-hint";
    hintEl.textContent = player.isBot ? "Bot" : (player.id === viewingPlayerId ? "You" : "Player");

    info.appendChild(nameEl);
    info.appendChild(hintEl);
    badge.appendChild(markEl);
    badge.appendChild(info);
    ui.playersBar.appendChild(badge);
  }

  // Render board
  if (state.variant === "super") {
    renderSuperBoard(state);
  } else {
    renderClassicBoard(state);
  }

  // Winner banner
  if (state.phase === "finished") {
    ui.winnerBanner.classList.remove("hidden");
    if (state.isDraw || (!state.winnerId && state.phase === "finished")) {
      ui.winnerName.textContent = "It's a Draw!";
      ui.winnerSubtext.textContent = "Neither player managed three in a row.";
    } else {
      const winner = state.players.find((p) => p.id === state.winnerId);
      ui.winnerName.textContent = `${winner?.name || "Someone"} Wins!`;
      ui.winnerSubtext.textContent = `Playing as ${winner?.mark}, three in a row!`;
    }
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
  scheduleBotMove(state);
}

function scheduleBotMove(state) {
  if (botTimeout) clearTimeout(botTimeout);
  if (state.phase !== "playing") return;
  if (mode !== "local" || !localState) return;

  const cp = state.players[state.currentPlayerIndex];
  const viewingId = currentViewingPlayerId(state);

  if (cp && cp.isBot) {
    botTimeout = setTimeout(() => {
      if (!localState || localState.phase !== "playing") return;
      const botAction = getBotMove(localState, localState.currentPlayerIndex);
      if (botAction) dispatchAction(botAction);
    }, 800);
  } else if (cp && cp.id === viewingId && autoPlay) {
    botTimeout = setTimeout(() => {
      if (!localState || localState.phase !== "playing") return;
      const idx = localState.players.findIndex((p) => p.id === viewingId);
      if (idx >= 0) {
        const botAction = getBotMove(localState, idx);
        if (botAction) dispatchAction(botAction);
      }
    }, 600);
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

  const botNames = ["Alpha Bot", "Beta Bot"];
  const players = [];

  if (!isSpectator) {
    players.push({ id: "p1", name, isBot: false });
  }

  for (let i = 0; i < botCount; i += 1) {
    const botName = botNames[i % botNames.length];
    players.push({ id: `bot${i + 1}`, name: botName, isBot: true });
  }

  // TTT needs exactly 2 players
  if (players.length < 2) {
    const extra = botNames[players.length % botNames.length];
    players.push({ id: "bot_extra", name: extra, isBot: true });
  }
  if (players.length > 2) {
    players.length = 2;
  }

  notice = null;
  localState = createGame({ players, options: { variant: selectedVariant } });
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
        gameType: "tic-tac-toe",
        options: { variant: selectedVariant },
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

ui.variantButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedVariant = button.dataset.variant;
    ui.variantButtons.forEach((b) => b.classList.toggle("active", b === button));
  });
});

ui.playerMinus.addEventListener("click", () => {
  const count = Math.max(1, Number(ui.playerCount.textContent) - 1);
  ui.playerCount.textContent = String(count);
});

ui.playerPlus.addEventListener("click", () => {
  const count = Math.min(1, Number(ui.playerCount.textContent) + 1);
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

ui.autoPlayToggle.addEventListener("click", () => {
  autoPlay = !autoPlay;
  ui.autoPlayToggle.textContent = autoPlay ? "Auto Play: On" : "Auto Play: Off";
  if (autoPlay && mode === "local" && localState && localState.phase === "playing") {
    const viewingId = currentViewingPlayerId(localState);
    const cp = localState.players[localState.currentPlayerIndex];
    if (cp && cp.id === viewingId) {
      if (botTimeout) clearTimeout(botTimeout);
      botTimeout = setTimeout(() => {
        if (!localState || localState.phase !== "playing") return;
        const idx = localState.players.findIndex((p) => p.id === viewingId);
        if (idx >= 0) {
          const botAction = getBotMove(localState, idx);
          if (botAction) dispatchAction(botAction);
        }
      }, 400);
    }
  }
});

ui.restartLocal.addEventListener("click", resetToSetup);
ui.winnerNewGame.addEventListener("click", resetToSetup);

// Sidebar
ui.toggleLogs.addEventListener("click", () => {
  ui.sidebar.classList.toggle("open");
  document.querySelector(".ttt-app").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".ttt-app").classList.remove("sidebar-open");
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
