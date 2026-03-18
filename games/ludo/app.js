import {
  applyAction,
  createGame,
  getBotMove,
  PLAYER_COLORS,
  PLAYER_START,
  SAFE_SPOTS,
  BOARD_SIZE,
  HOME_COLUMN_LENGTH,
  TOKENS_PER_PLAYER,
  resolvePosition,
  getMovableTokens,
} from "./game.js";

// ================================================
// Board coordinate mappings
// ================================================
// The Ludo board is a 15x15 grid. We map each of the 52 shared squares
// and the home columns to (row, col) grid coordinates.

// Main track: 52 positions (0-51), going clockwise
// We define the path manually for a standard Ludo board layout
const MAIN_TRACK_COORDS = [
  // Bottom arm going up (red side) - positions 0-4
  { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
  // Turn up - position 5
  { r: 5, c: 6 },
  // Left arm going up - positions 6-10
  { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  // Turn right - positions 11-12
  { r: 0, c: 7 }, { r: 0, c: 8 },
  // Top arm going down (blue side) - positions 13-17
  { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
  // Turn right - position 18
  { r: 6, c: 9 },
  // Top right going right - positions 19-23
  { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
  // Turn down - positions 24-25
  { r: 7, c: 14 }, { r: 8, c: 14 },
  // Right arm going down (green side) - positions 26-30
  { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
  // Turn down - position 31
  { r: 9, c: 8 },
  // Bottom right going down - positions 32-36
  { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
  // Turn left - positions 37-38
  { r: 14, c: 7 }, { r: 14, c: 6 },
  // Bottom arm going up (yellow side) - positions 39-43
  { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
  // Turn left - position 44
  { r: 8, c: 5 },
  // Bottom left going left - positions 45-49
  { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
  // Turn up - positions 50-51
  { r: 7, c: 0 }, { r: 6, c: 0 },
];

// Home columns for each player (6 squares each, leading to center)
const HOME_COLUMN_COORDS = [
  // Red (enters from bottom-left, goes right along row 7)
  [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }],
  // Blue (enters from top-left, goes down along col 7)
  [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }, { r: 6, c: 7 }],
  // Green (enters from top-right, goes left along row 7)
  [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 8 }],
  // Yellow (enters from bottom-right, goes up along col 7)
  [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }, { r: 8, c: 7 }],
];

// Home base positions for tokens in base (4 positions per player)
const HOME_BASE_COORDS = [
  // Red (top-left quadrant of bottom-left)
  [{ r: 10, c: 1 }, { r: 10, c: 3 }, { r: 12, c: 1 }, { r: 12, c: 3 }],
  // Blue (top-left)
  [{ r: 1, c: 1 }, { r: 1, c: 3 }, { r: 3, c: 1 }, { r: 3, c: 3 }],
  // Green (top-right)
  [{ r: 1, c: 11 }, { r: 1, c: 13 }, { r: 3, c: 11 }, { r: 3, c: 13 }],
  // Yellow (bottom-right)
  [{ r: 10, c: 11 }, { r: 10, c: 13 }, { r: 12, c: 11 }, { r: 12, c: 13 }],
];

// CSS color values for each player
const COLOR_VALUES = {
  red: { main: "#e74c3c", light: "#ff6b6b", dim: "rgba(231, 76, 60, 0.3)", dark: "#c0392b" },
  blue: { main: "#3498db", light: "#5dade2", dim: "rgba(52, 152, 219, 0.3)", dark: "#2471a3" },
  green: { main: "#2ecc71", light: "#58d68d", dim: "rgba(46, 204, 113, 0.3)", dark: "#1e8449" },
  yellow: { main: "#f1c40f", light: "#f7dc6f", dim: "rgba(241, 196, 15, 0.3)", dark: "#d4ac0d" },
};

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
  autoPlayToggle: document.getElementById("autoPlayToggle"),
  restartLocal: document.getElementById("restartLocal"),
  boardContainer: document.getElementById("boardContainer"),
  diceArea: document.getElementById("diceArea"),
  diceBtn: document.getElementById("diceBtn"),
  diceResult: document.getElementById("diceResult"),
  tokenChoices: document.getElementById("tokenChoices"),
  sidebar: document.getElementById("sidebar"),
  sidebarLogs: document.getElementById("sidebarLogs"),
  toggleLogs: document.getElementById("toggleLogs"),
  closeSidebar: document.getElementById("closeSidebar"),
  toast: document.getElementById("toast"),
  winnerBanner: document.getElementById("winnerBanner"),
  winnerName: document.getElementById("winnerName"),
  winnerNewGame: document.getElementById("winnerNewGame"),
  playersStatus: document.getElementById("playersStatus"),
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
// Board Rendering
// ================================================
function getTokenScreenPos(playerIndex, tokenIndex, position, finished) {
  const cellSize = 100 / 15;

  if (finished) {
    // Show in center area
    const offsets = [
      { r: -0.3, c: -0.3 }, { r: -0.3, c: 0.3 },
      { r: 0.3, c: -0.3 }, { r: 0.3, c: 0.3 },
    ];
    const off = offsets[tokenIndex];
    return {
      x: (7 + off.c) * cellSize + cellSize / 2,
      y: (7 + off.r) * cellSize + cellSize / 2,
    };
  }

  if (position === 0) {
    // In home base
    const coord = HOME_BASE_COORDS[playerIndex][tokenIndex];
    return {
      x: coord.c * cellSize + cellSize / 2,
      y: coord.r * cellSize + cellSize / 2,
    };
  }

  if (position > 50 && position < 57) {
    // Home column
    const colIdx = position - 51;
    const coord = HOME_COLUMN_COORDS[playerIndex][colIdx];
    return {
      x: coord.c * cellSize + cellSize / 2,
      y: coord.r * cellSize + cellSize / 2,
    };
  }

  // Main track
  const absPos = (PLAYER_START[playerIndex] + position - 1) % BOARD_SIZE;
  const coord = MAIN_TRACK_COORDS[absPos];
  return {
    x: coord.c * cellSize + cellSize / 2,
    y: coord.r * cellSize + cellSize / 2,
  };
}

function renderBoard(state) {
  const container = ui.boardContainer;
  container.innerHTML = "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("class", "ludo-board-svg");

  const cellSize = 100 / 15;
  const cs = cellSize;

  // Background
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", "100");
  bg.setAttribute("height", "100");
  bg.setAttribute("fill", "#1a1a2e");
  bg.setAttribute("rx", "2");
  svg.appendChild(bg);

  // Draw quadrant backgrounds (home bases)
  const quadrants = [
    { color: COLOR_VALUES.red.dim, x: 0, y: 9 * cs, w: 6 * cs, h: 6 * cs }, // red bottom-left
    { color: COLOR_VALUES.blue.dim, x: 0, y: 0, w: 6 * cs, h: 6 * cs }, // blue top-left
    { color: COLOR_VALUES.green.dim, x: 9 * cs, y: 0, w: 6 * cs, h: 6 * cs }, // green top-right
    { color: COLOR_VALUES.yellow.dim, x: 9 * cs, y: 9 * cs, w: 6 * cs, h: 6 * cs }, // yellow bottom-right
  ];

  for (const q of quadrants) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", q.x);
    rect.setAttribute("y", q.y);
    rect.setAttribute("width", q.w);
    rect.setAttribute("height", q.h);
    rect.setAttribute("fill", q.color);
    rect.setAttribute("rx", "1.5");
    svg.appendChild(rect);
  }

  // Draw home base inner boxes
  const homeBoxes = [
    { color: COLOR_VALUES.red.dark, x: 0.5 * cs, y: 9.5 * cs, w: 5 * cs, h: 5 * cs },
    { color: COLOR_VALUES.blue.dark, x: 0.5 * cs, y: 0.5 * cs, w: 5 * cs, h: 5 * cs },
    { color: COLOR_VALUES.green.dark, x: 9.5 * cs, y: 0.5 * cs, w: 5 * cs, h: 5 * cs },
    { color: COLOR_VALUES.yellow.dark, x: 9.5 * cs, y: 9.5 * cs, w: 5 * cs, h: 5 * cs },
  ];

  for (const hb of homeBoxes) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", hb.x);
    rect.setAttribute("y", hb.y);
    rect.setAttribute("width", hb.w);
    rect.setAttribute("height", hb.h);
    rect.setAttribute("fill", hb.color);
    rect.setAttribute("fill-opacity", "0.3");
    rect.setAttribute("rx", "1");
    rect.setAttribute("stroke", hb.color);
    rect.setAttribute("stroke-width", "0.15");
    rect.setAttribute("stroke-opacity", "0.5");
    svg.appendChild(rect);
  }

  // Draw main track squares
  for (let i = 0; i < BOARD_SIZE; i++) {
    const coord = MAIN_TRACK_COORDS[i];
    const x = coord.c * cs;
    const y = coord.r * cs;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x + 0.1);
    rect.setAttribute("y", y + 0.1);
    rect.setAttribute("width", cs - 0.2);
    rect.setAttribute("height", cs - 0.2);
    rect.setAttribute("rx", "0.5");

    let fillColor = "rgba(255,255,255,0.08)";
    let strokeColor = "rgba(255,255,255,0.15)";

    // Color start positions
    if (i === PLAYER_START[0]) { fillColor = COLOR_VALUES.red.dim; strokeColor = COLOR_VALUES.red.main; }
    else if (i === PLAYER_START[1]) { fillColor = COLOR_VALUES.blue.dim; strokeColor = COLOR_VALUES.blue.main; }
    else if (i === PLAYER_START[2]) { fillColor = COLOR_VALUES.green.dim; strokeColor = COLOR_VALUES.green.main; }
    else if (i === PLAYER_START[3]) { fillColor = COLOR_VALUES.yellow.dim; strokeColor = COLOR_VALUES.yellow.main; }
    else if (SAFE_SPOTS.includes(i)) {
      fillColor = "rgba(255,255,255,0.12)";
      strokeColor = "rgba(255,255,255,0.3)";
    }

    rect.setAttribute("fill", fillColor);
    rect.setAttribute("stroke", strokeColor);
    rect.setAttribute("stroke-width", "0.15");
    svg.appendChild(rect);

    // Safe spot star
    if (SAFE_SPOTS.includes(i)) {
      const star = document.createElementNS("http://www.w3.org/2000/svg", "text");
      star.setAttribute("x", x + cs / 2);
      star.setAttribute("y", y + cs / 2 + 1);
      star.setAttribute("text-anchor", "middle");
      star.setAttribute("dominant-baseline", "middle");
      star.setAttribute("font-size", "2.5");
      star.setAttribute("fill", "rgba(255,255,255,0.4)");
      star.textContent = "\u2605";
      svg.appendChild(star);
    }
  }

  // Draw home columns
  for (let pi = 0; pi < state.players.length; pi++) {
    const color = COLOR_VALUES[state.players[pi].color];
    for (let ci = 0; ci < HOME_COLUMN_LENGTH; ci++) {
      const coord = HOME_COLUMN_COORDS[pi][ci];
      const x = coord.c * cs;
      const y = coord.r * cs;

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x + 0.1);
      rect.setAttribute("y", y + 0.1);
      rect.setAttribute("width", cs - 0.2);
      rect.setAttribute("height", cs - 0.2);
      rect.setAttribute("rx", "0.5");
      rect.setAttribute("fill", color.dim);
      rect.setAttribute("stroke", color.main);
      rect.setAttribute("stroke-width", "0.15");
      rect.setAttribute("stroke-opacity", "0.5");
      svg.appendChild(rect);
    }
  }

  // Draw center (finish area)
  const centerTriangles = [
    { color: COLOR_VALUES.red.main, points: `${7*cs},${7*cs} ${8*cs},${7*cs} ${7.5*cs},${8*cs}` },
    { color: COLOR_VALUES.blue.main, points: `${7*cs},${7*cs} ${7*cs},${8*cs} ${6*cs},${7.5*cs}` },
    { color: COLOR_VALUES.green.main, points: `${8*cs},${7*cs} ${9*cs},${7.5*cs} ${8*cs},${8*cs}` },
    { color: COLOR_VALUES.yellow.main, points: `${7*cs},${8*cs} ${8*cs},${8*cs} ${7.5*cs},${9*cs}` },
  ];

  // Actually draw a simpler center
  const centerRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  centerRect.setAttribute("x", 6 * cs);
  centerRect.setAttribute("y", 6 * cs);
  centerRect.setAttribute("width", 3 * cs);
  centerRect.setAttribute("height", 3 * cs);
  centerRect.setAttribute("fill", "rgba(255,255,255,0.05)");
  centerRect.setAttribute("stroke", "rgba(255,255,255,0.2)");
  centerRect.setAttribute("stroke-width", "0.2");
  centerRect.setAttribute("rx", "1");
  svg.appendChild(centerRect);

  // Center triangles pointing inward
  for (const tri of centerTriangles) {
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", tri.points);
    polygon.setAttribute("fill", tri.color);
    polygon.setAttribute("fill-opacity", "0.4");
    svg.appendChild(polygon);
  }

  // Draw home base token circles (empty positions)
  for (let pi = 0; pi < state.players.length; pi++) {
    const color = COLOR_VALUES[state.players[pi].color];
    for (let ti = 0; ti < TOKENS_PER_PLAYER; ti++) {
      const coord = HOME_BASE_COORDS[pi][ti];
      const cx = coord.c * cs + cs / 2;
      const cy = coord.r * cs + cs / 2;

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", cs * 0.3);
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", color.main);
      circle.setAttribute("stroke-width", "0.15");
      circle.setAttribute("stroke-opacity", "0.3");
      circle.setAttribute("stroke-dasharray", "0.5 0.5");
      svg.appendChild(circle);
    }
  }

  // Draw tokens
  const viewingId = currentViewingPlayerId(state);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === viewingId;
  const canChooseToken = isMyTurn && state.subPhase === "move_token";

  for (let pi = 0; pi < state.players.length; pi++) {
    const player = state.players[pi];
    const color = COLOR_VALUES[player.color];

    for (let ti = 0; ti < TOKENS_PER_PLAYER; ti++) {
      const token = player.tokens[ti];
      const pos = getTokenScreenPos(pi, ti, token.position, token.finished);

      const isMovable = canChooseToken && pi === state.currentPlayerIndex &&
        state.movableTokens.includes(ti);

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", `token ${isMovable ? "token-movable" : ""}`);

      if (isMovable) {
        // Pulsing highlight
        const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pulse.setAttribute("cx", pos.x);
        pulse.setAttribute("cy", pos.y);
        pulse.setAttribute("r", cs * 0.45);
        pulse.setAttribute("fill", color.main);
        pulse.setAttribute("fill-opacity", "0.3");
        pulse.setAttribute("class", "token-pulse");
        g.appendChild(pulse);
      }

      // Token body
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", pos.x);
      circle.setAttribute("cy", pos.y);
      circle.setAttribute("r", cs * 0.35);
      circle.setAttribute("fill", color.main);
      circle.setAttribute("stroke", token.finished ? "#fff" : color.light);
      circle.setAttribute("stroke-width", isMovable ? "0.4" : "0.2");

      if (isMovable) {
        circle.style.cursor = "pointer";
        circle.setAttribute("class", "token-clickable");
        circle.addEventListener("click", () => {
          dispatchAction({
            type: "move_token",
            playerId: viewingId,
            tokenIndex: ti,
          });
        });
      }

      g.appendChild(circle);

      // Token number
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", pos.x);
      text.setAttribute("y", pos.y + 0.8);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("font-size", "2.2");
      text.setAttribute("font-weight", "bold");
      text.setAttribute("fill", "#fff");
      text.setAttribute("pointer-events", "none");
      text.textContent = String(ti + 1);
      g.appendChild(text);

      svg.appendChild(g);
    }
  }

  container.appendChild(svg);
}

// ================================================
// Dice Rendering
// ================================================
function renderDiceFace(value) {
  const dotPositions = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
  };

  const dots = dotPositions[value] || [];
  let svgContent = `<svg viewBox="0 0 100 100" class="dice-svg">
    <rect width="100" height="100" rx="15" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>`;

  for (const [cx, cy] of dots) {
    svgContent += `<circle cx="${cx}" cy="${cy}" r="10" fill="#fff"/>`;
  }

  svgContent += `</svg>`;
  return svgContent;
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

  // Set turn card border color to current player's color
  const cpColor = currentPlayer ? COLOR_VALUES[currentPlayer.color] : null;
  if (cpColor) {
    ui.turnCard.style.setProperty("--turn-color", cpColor.main);
    ui.turnCard.style.setProperty("--turn-dim", cpColor.dim);
  }

  if (notice) {
    ui.turnHint.textContent = notice;
  } else if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.turnHint.textContent = winner ? `${winner.name} wins!` : "Game over.";
  } else if (state.subPhase === "roll_dice" && isMyTurn) {
    ui.turnHint.textContent = "Roll the dice!";
  } else if (state.subPhase === "move_token" && isMyTurn) {
    ui.turnHint.textContent = "Choose a token to move";
  } else if (isMyTurn) {
    ui.turnHint.textContent = "Your move";
  } else {
    ui.turnHint.textContent = `Waiting for ${currentPlayer?.name}...`;
  }

  // Winner banner
  if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.winnerBanner.classList.remove("hidden");
    ui.winnerName.textContent = `${winner?.name || "Someone"} Wins!`;
  } else {
    ui.winnerBanner.classList.add("hidden");
  }

  // Dice area
  if (state.diceValue) {
    ui.diceResult.innerHTML = renderDiceFace(state.diceValue);
    ui.diceResult.classList.remove("hidden");
  } else {
    ui.diceResult.classList.add("hidden");
  }

  // Dice button
  ui.diceBtn.disabled = !(isMyTurn && state.subPhase === "roll_dice" && state.phase === "playing");

  // Token choice buttons (for when there are multiple movable tokens)
  ui.tokenChoices.innerHTML = "";
  if (isMyTurn && state.subPhase === "move_token" && state.movableTokens.length > 1) {
    for (const ti of state.movableTokens) {
      const btn = document.createElement("button");
      const token = currentPlayer.tokens[ti];
      const posLabel = token.position === 0 ? "Base" : `Pos ${token.position}`;
      btn.className = "token-choice-btn";
      btn.textContent = `Token ${ti + 1} (${posLabel})`;
      btn.style.setProperty("--token-color", cpColor ? cpColor.main : "#fff");
      btn.addEventListener("click", () => {
        dispatchAction({
          type: "move_token",
          playerId: viewingPlayerId,
          tokenIndex: ti,
        });
      });
      ui.tokenChoices.appendChild(btn);
    }
  }

  // Player status bar
  ui.playersStatus.innerHTML = "";
  for (const player of state.players) {
    const color = COLOR_VALUES[player.color];
    const finishedCount = player.tokens.filter((t) => t.finished).length;
    const onBoard = player.tokens.filter((t) => !t.finished && t.position > 0).length;
    const inBase = player.tokens.filter((t) => t.position === 0 && !t.finished).length;
    const isCurrent = player === currentPlayer;

    const div = document.createElement("div");
    div.className = `player-status ${isCurrent ? "active" : ""} ${player.hasWon ? "won" : ""}`;
    div.style.setProperty("--player-color", color.main);
    div.style.setProperty("--player-dim", color.dim);

    div.innerHTML = `
      <div class="ps-color" style="background:${color.main}"></div>
      <div class="ps-info">
        <div class="ps-name">${player.name}</div>
        <div class="ps-tokens">
          ${player.hasWon ? "Finished!" : `Home: ${finishedCount}/4 | Board: ${onBoard} | Base: ${inBase}`}
        </div>
      </div>
    `;
    ui.playersStatus.appendChild(div);
  }

  // Render board
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
    if (cp && (cp.isBot || (cp.id === viewingPlayerId && autoPlay))) {
      if (botTimeout) clearTimeout(botTimeout);
      const delay = cp.isBot ? 1200 : 800;
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
  const name = document.getElementById("localName").value.trim() || "Player";
  const botCount = Number(ui.playerCount.textContent);
  const isSpectator = ui.localSpectator.checked;

  const botNames = ["Red Bot", "Blue Bot", "Green Bot", "Yellow Bot"];
  const players = [];

  if (!isSpectator) {
    players.push({ id: "p1", name, isBot: false });
  }

  for (let i = 0; i < botCount; i += 1) {
    players.push({ id: `bot${i + 1}`, name: botNames[(isSpectator ? i : i + 1) % 4], isBot: true });
  }

  if (players.length < 2) {
    players.push({ id: "bot_extra", name: "Extra Bot", isBot: true });
  }

  // Cap at 4
  while (players.length > 4) players.pop();

  notice = null;
  localState = createGame({ players });
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
        gameType: "ludo",
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

// Dice button
ui.diceBtn.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "playing" || state.subPhase !== "roll_dice") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;
  dispatchAction({ type: "roll_dice", playerId: viewingId });
});

ui.autoPlayToggle.addEventListener("click", () => {
  autoPlay = !autoPlay;
  ui.autoPlayToggle.textContent = autoPlay ? "Auto Play: On" : "Auto Play: Off";
  if (autoPlay && mode === "local" && localState && localState.phase === "playing") {
    const cp = localState.players[localState.currentPlayerIndex];
    const viewingId = currentViewingPlayerId(localState);
    if (cp && cp.id === viewingId) {
      if (botTimeout) clearTimeout(botTimeout);
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
});

ui.restartLocal.addEventListener("click", resetToSetup);
ui.winnerNewGame.addEventListener("click", resetToSetup);

// Sidebar
ui.toggleLogs.addEventListener("click", () => {
  ui.sidebar.classList.toggle("open");
  document.querySelector(".ludo-app").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".ludo-app").classList.remove("sidebar-open");
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
