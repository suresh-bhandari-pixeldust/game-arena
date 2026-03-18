import {
  applyAction,
  createGame,
  getBotMove,
  ARENA_WIDTH,
  ARENA_HEIGHT,
  PEN_RADIUS,
  PEN_COLORS,
  POINTS_TO_WIN,
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
  canvas: document.getElementById("arenaCanvas"),
  scoreP1: document.getElementById("scoreP1"),
  scoreP2: document.getElementById("scoreP2"),
  nameP1: document.getElementById("nameP1"),
  nameP2: document.getElementById("nameP2"),
  powerSlider: document.getElementById("powerSlider"),
  powerValue: document.getElementById("powerValue"),
  flickBtn: document.getElementById("flickBtn"),
  aimControls: document.getElementById("aimControls"),
  sidebar: document.getElementById("sidebar"),
  sidebarLogs: document.getElementById("sidebarLogs"),
  toggleLogs: document.getElementById("toggleLogs"),
  closeSidebar: document.getElementById("closeSidebar"),
  toast: document.getElementById("toast"),
  winnerBanner: document.getElementById("winnerBanner"),
  winnerName: document.getElementById("winnerName"),
  winnerNewGame: document.getElementById("winnerNewGame"),
};

const ctx = ui.canvas.getContext("2d");

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

// Aiming state
let aimAngle = 0;
let isDragging = false;
let dragStart = null;

// Animation state
let animFrameIndex = 0;
let isAnimating = false;
let animationRAF = null;

// Canvas scaling
let canvasScale = 1;
let canvasOffsetX = 0;
let canvasOffsetY = 0;

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
// Canvas Rendering
// ================================================
function resizeCanvas() {
  const container = ui.canvas.parentElement;
  const maxW = container.clientWidth;
  const maxH = Math.min(window.innerHeight * 0.5, 500);
  const ratio = ARENA_WIDTH / ARENA_HEIGHT;

  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }

  const dpr = window.devicePixelRatio || 1;
  ui.canvas.width = w * dpr;
  ui.canvas.height = h * dpr;
  ui.canvas.style.width = `${w}px`;
  ui.canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  canvasScale = w / ARENA_WIDTH;
  canvasOffsetX = 0;
  canvasOffsetY = 0;
}

function drawTable(w, h) {
  // Wooden desk background
  ctx.save();
  ctx.fillStyle = "#2d1f14";
  ctx.fillRect(0, 0, w, h);

  // Wood grain lines
  ctx.strokeStyle = "rgba(60, 40, 25, 0.4)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    const y = (i / 20) * h + Math.sin(i * 0.7) * 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.3, y + 2, w * 0.7, y - 2, w, y + 1);
    ctx.stroke();
  }

  // Notebook paper area (arena)
  const sx = 0;
  const sy = 0;
  const sw = ARENA_WIDTH * canvasScale;
  const sh = ARENA_HEIGHT * canvasScale;

  // Paper shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  // Paper background
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(sx, sy, sw, sh);
  ctx.shadowColor = "transparent";

  // Ruled lines (blue)
  ctx.strokeStyle = "rgba(100, 140, 200, 0.25)";
  ctx.lineWidth = 0.8 * canvasScale;
  const lineSpacing = 25 * canvasScale;
  for (let y = lineSpacing; y < sh; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(sx, sy + y);
    ctx.lineTo(sx + sw, sy + y);
    ctx.stroke();
  }

  // Red margin line
  ctx.strokeStyle = "rgba(200, 80, 80, 0.35)";
  ctx.lineWidth = 1.5 * canvasScale;
  const marginX = sx + 50 * canvasScale;
  ctx.beginPath();
  ctx.moveTo(marginX, sy);
  ctx.lineTo(marginX, sy + sh);
  ctx.stroke();

  // Border of the arena (table edge)
  ctx.strokeStyle = "rgba(139, 90, 43, 0.8)";
  ctx.lineWidth = 3 * canvasScale;
  ctx.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);

  // Corner markers (danger zones)
  const cornerSize = 20 * canvasScale;
  ctx.fillStyle = "rgba(200, 50, 50, 0.15)";
  // Top-left
  ctx.fillRect(sx, sy, cornerSize, cornerSize);
  // Top-right
  ctx.fillRect(sx + sw - cornerSize, sy, cornerSize, cornerSize);
  // Bottom-left
  ctx.fillRect(sx, sy + sh - cornerSize, cornerSize, cornerSize);
  // Bottom-right
  ctx.fillRect(sx + sw - cornerSize, sy + sh - cornerSize, cornerSize, cornerSize);

  ctx.restore();
}

function drawPen(pen, index, scale) {
  if (pen.offTable) return;

  const x = pen.x * scale;
  const y = pen.y * scale;
  const r = PEN_RADIUS * scale;
  const color = PEN_COLORS[index];

  ctx.save();
  ctx.translate(x, y);

  // Pen body (elongated oval)
  const penLength = r * 3;
  const penWidth = r * 1.2;
  const angle = pen.angle || (index === 0 ? 0 : Math.PI);

  ctx.rotate(angle);

  // Shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 6 * scale;
  ctx.shadowOffsetX = 2 * scale;
  ctx.shadowOffsetY = 2 * scale;

  // Pen body
  ctx.beginPath();
  ctx.ellipse(0, 0, penLength, penWidth, 0, 0, Math.PI * 2);
  ctx.fillStyle = color.body;
  ctx.fill();
  ctx.shadowColor = "transparent";

  // Pen cap (front tip)
  ctx.beginPath();
  ctx.ellipse(penLength * 0.7, 0, penLength * 0.35, penWidth * 0.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = color.cap;
  ctx.fill();

  // Pen tip
  ctx.beginPath();
  ctx.moveTo(penLength, 0);
  ctx.lineTo(penLength * 1.2, -penWidth * 0.3);
  ctx.lineTo(penLength * 1.2, penWidth * 0.3);
  ctx.closePath();
  ctx.fillStyle = "#1a1a1a";
  ctx.fill();

  // Highlight/shine
  ctx.beginPath();
  ctx.ellipse(-penLength * 0.1, -penWidth * 0.35, penLength * 0.5, penWidth * 0.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.fill();

  // Clip ring
  ctx.beginPath();
  ctx.rect(-penLength * 0.3 - 2 * scale, -penWidth, 4 * scale, penWidth * 2);
  ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
  ctx.fill();

  ctx.restore();

  // Player indicator circle underneath
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = color.body;
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.restore();
}

function drawAimArrow(pen, angle, power, scale) {
  if (pen.offTable) return;

  const x = pen.x * scale;
  const y = pen.y * scale;
  const len = (power / 18) * 80 * scale;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Dashed line
  ctx.setLineDash([6 * scale, 4 * scale]);
  ctx.strokeStyle = "rgba(255, 100, 50, 0.7)";
  ctx.lineWidth = 2.5 * scale;
  ctx.beginPath();
  ctx.moveTo(PEN_RADIUS * scale * 1.5, 0);
  ctx.lineTo(PEN_RADIUS * scale * 1.5 + len, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrow head
  const tipX = PEN_RADIUS * scale * 1.5 + len;
  ctx.beginPath();
  ctx.moveTo(tipX + 8 * scale, 0);
  ctx.lineTo(tipX - 4 * scale, -6 * scale);
  ctx.lineTo(tipX - 4 * scale, 6 * scale);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 100, 50, 0.8)";
  ctx.fill();

  ctx.restore();
}

function drawScoresOnCanvas(state, w, h) {
  ctx.save();
  const fontSize = 14 * canvasScale;
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";

  // Player 1 score
  ctx.fillStyle = PEN_COLORS[0].body;
  ctx.fillText(
    `${state.players[0].name}: ${state.scores[0]}`,
    w * 0.25,
    20 * canvasScale
  );

  // Player 2 score
  ctx.fillStyle = PEN_COLORS[1].body;
  ctx.fillText(
    `${state.players[1].name}: ${state.scores[1]}`,
    w * 0.75,
    20 * canvasScale
  );

  // Round
  ctx.fillStyle = "rgba(80, 60, 40, 0.6)";
  ctx.font = `600 ${fontSize * 0.8}px system-ui, sans-serif`;
  ctx.fillText(`Round ${state.round}`, w * 0.5, h - 10 * canvasScale);

  ctx.restore();
}

function renderCanvas() {
  const state = currentState();
  if (!state) return;

  const w = ui.canvas.width / (window.devicePixelRatio || 1);
  const h = ui.canvas.height / (window.devicePixelRatio || 1);

  ctx.clearRect(0, 0, w, h);
  drawTable(w, h);
  drawScoresOnCanvas(state, w, h);

  // Draw pens
  for (let i = 0; i < state.pens.length; i++) {
    drawPen(state.pens[i], i, canvasScale);
  }

  // Draw aim arrow if aiming
  if (state.phase === "aiming" && !isAnimating) {
    const viewingId = currentViewingPlayerId(state);
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer && currentPlayer.id === viewingId) {
      const pen = state.pens[state.currentPlayerIndex];
      const power = parseFloat(ui.powerSlider.value);
      drawAimArrow(pen, aimAngle, power, canvasScale);
    }
  }
}

// ================================================
// Animation
// ================================================
function animatePhysics(state, callback) {
  if (!state.physicsFrames || state.physicsFrames.length === 0) {
    callback();
    return;
  }

  isAnimating = true;
  animFrameIndex = 0;
  const frames = state.physicsFrames;
  const framesPerTick = 2; // show every 2nd frame for speed
  let tickCount = 0;

  function tick() {
    if (animFrameIndex >= frames.length) {
      isAnimating = false;
      callback();
      return;
    }

    const frame = frames[animFrameIndex];
    // Update pen positions from frame
    for (let i = 0; i < frame.pens.length; i++) {
      state.pens[i].x = frame.pens[i].x;
      state.pens[i].y = frame.pens[i].y;
      state.pens[i].offTable = frame.pens[i].offTable;

      // Update angle based on velocity
      if (frame.pens[i].vx !== 0 || frame.pens[i].vy !== 0) {
        state.pens[i].angle = Math.atan2(frame.pens[i].vy, frame.pens[i].vx);
      }
    }

    renderCanvas();
    animFrameIndex += framesPerTick;
    animationRAF = requestAnimationFrame(tick);
  }

  tick();
}

// ================================================
// Rendering UI
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

  if (notice) {
    ui.turnHint.textContent = notice;
  } else if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.turnHint.textContent = winner ? `${winner.name} wins the match!` : "Game over.";
  } else if (state.phase === "simulating") {
    ui.turnHint.textContent = "Pen is sliding...";
  } else if (state.phase === "aiming" && isMyTurn) {
    ui.turnHint.textContent = "Aim and flick your pen!";
  } else if (state.phase === "aiming") {
    ui.turnHint.textContent = `Waiting for ${currentPlayer?.name} to flick...`;
  } else {
    ui.turnHint.textContent = "Waiting...";
  }

  // Scores
  ui.nameP1.textContent = state.players[0].name;
  ui.nameP2.textContent = state.players[1].name;
  ui.scoreP1.textContent = state.scores[0];
  ui.scoreP2.textContent = state.scores[1];

  // Aim controls visibility
  const canAim = isMyTurn && state.phase === "aiming" && !isAnimating;
  ui.aimControls.classList.toggle("hidden", !canAim);
  ui.flickBtn.disabled = !canAim;

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

  renderCanvas();

  // Bot automation
  if (mode === "local" && state.phase === "aiming" && !isAnimating) {
    const cp = state.players[state.currentPlayerIndex];
    if (cp && cp.isBot) {
      setTimeout(() => {
        if (!localState || localState.phase !== "aiming") return;
        const botAction = getBotMove(localState, localState.currentPlayerIndex);
        if (botAction) dispatchAction(botAction);
      }, 800 + Math.random() * 600);
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

  clearNotice();

  const result = applyAction(localState, action);
  if (result.error) {
    showNotice(result.error);
    return;
  }
  localState = result.state;

  if (localState.phase === "simulating") {
    // Animate physics frames, then end turn
    render();
    animatePhysics(localState, () => {
      const endResult = applyAction(localState, {
        type: "endTurn",
        playerId: action.playerId,
      });
      if (!endResult.error) {
        localState = endResult.state;
      }
      render();
    });
  } else {
    render();
  }
}

// ================================================
// Canvas Interaction (Aiming)
// ================================================
function getCanvasPos(e) {
  const rect = ui.canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) / canvasScale,
    y: (clientY - rect.top) / canvasScale,
  };
}

function updateAimFromMouse(e) {
  const state = currentState();
  if (!state || state.phase !== "aiming" || isAnimating) return;

  const viewingId = currentViewingPlayerId(state);
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== viewingId) return;

  const pos = getCanvasPos(e);
  const pen = state.pens[state.currentPlayerIndex];
  const dx = pos.x - pen.x;
  const dy = pos.y - pen.y;
  aimAngle = Math.atan2(dy, dx);

  renderCanvas();
}

ui.canvas.addEventListener("mousemove", updateAimFromMouse);
ui.canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  updateAimFromMouse(e);
}, { passive: false });

ui.canvas.addEventListener("click", (e) => {
  const state = currentState();
  if (!state || state.phase !== "aiming" || isAnimating) return;

  const viewingId = currentViewingPlayerId(state);
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== viewingId) return;

  // Quick flick on click
  const power = parseFloat(ui.powerSlider.value);
  dispatchAction({
    type: "flick",
    playerId: viewingId,
    angle: aimAngle,
    power,
  });
});

// Power slider
ui.powerSlider.addEventListener("input", () => {
  ui.powerValue.textContent = Math.round(ui.powerSlider.value);
  renderCanvas();
});

// Flick button
ui.flickBtn.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "aiming" || isAnimating) return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;

  const power = parseFloat(ui.powerSlider.value);
  dispatchAction({
    type: "flick",
    playerId: viewingId,
    angle: aimAngle,
    power,
  });
});

// ================================================
// Game Setup
// ================================================
function startLocalGame() {
  const name = document.getElementById("localName").value.trim() || "Player";

  const players = [
    { id: "p1", name, isBot: false },
    { id: "bot1", name: "Bot", isBot: true },
  ];

  notice = null;
  localState = createGame({ players });
  myPlayerId = "p1";
  setStatus("Single Player");
  ui.setupPanel.classList.add("hidden");
  resizeCanvas();
  render();
}

function resetToSetup() {
  if (animationRAF) cancelAnimationFrame(animationRAF);
  clearNotice();
  localState = null;
  onlineState = null;
  notice = null;
  isAnimating = false;
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
        gameType: "pen-fight",
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
        ? "You are the host. Start when ready."
        : "Waiting for the host to start.";
    }
    if (message.type === "game_state") {
      onlineState = message.state;
      notice = null;
      ui.setupPanel.classList.add("hidden");
      resizeCanvas();
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
  document.querySelector(".pf-app").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".pf-app").classList.remove("sidebar-open");
});

// Window resize
window.addEventListener("resize", () => {
  if (currentState()) {
    resizeCanvas();
    renderCanvas();
  }
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
