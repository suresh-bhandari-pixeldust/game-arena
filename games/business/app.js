import {
  applyAction,
  createGame,
  getBotMove,
  BOARD,
  BOARD_SIZE,
  COLOR_GROUPS,
  GO_SALARY,
  JAIL_POSITION,
  JAIL_FINE,
  MAX_HOUSES,
  HOTEL_LEVEL,
  STARTING_MONEY,
  ROLL_TO_START,
  ownsFullGroup,
  getPropertiesInGroup,
  calculateRent,
} from "./game.js";

// ================================================
// Board coordinate mapping
// ================================================
// The Monopoly board is a square with spaces around the perimeter.
// We render it as an SVG with spaces arranged in a loop.
// Board positions:
// Bottom row: 0 (GO) at bottom-right, going left to 10 (Jail) at bottom-left
// Left column: 11-19 going up
// Top row: 20 (Free Parking) at top-left, going right to 30 (Go To Jail) at top-right
// Right column: 31-39 going down

const BOARD_LAYOUT = {
  // Bottom row (right to left): positions 0-10
  // Position 0 = bottom-right corner (GO)
  bottom: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  // Left column (bottom to top): positions 11-19
  left: [11, 12, 13, 14, 15, 16, 17, 18, 19],
  // Top row (left to right): positions 20-30
  top: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
  // Right column (top to bottom): positions 31-39
  right: [31, 32, 33, 34, 35, 36, 37, 38, 39],
};

const PLAYER_COLORS = [
  { main: "#ff453a", light: "#ff6961", dim: "rgba(255, 69, 58, 0.25)" },
  { main: "#0a84ff", light: "#409cff", dim: "rgba(10, 132, 255, 0.25)" },
  { main: "#30d158", light: "#63e085", dim: "rgba(48, 209, 88, 0.25)" },
  { main: "#ffd60a", light: "#ffe44d", dim: "rgba(255, 214, 10, 0.25)" },
  { main: "#bf5af2", light: "#d17df4", dim: "rgba(191, 90, 242, 0.25)" },
  { main: "#ff9f0a", light: "#ffb340", dim: "rgba(255, 159, 10, 0.25)" },
];

const GROUP_COLORS = {
  brown: "#8B4513",
  lightBlue: "#87CEEB",
  pink: "#FF69B4",
  orange: "#FF8C00",
  red: "#DC143C",
  yellow: "#FFD700",
  green: "#228B22",
  darkBlue: "#00008B",
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
  die1: document.getElementById("die1"),
  die2: document.getElementById("die2"),
  rollDiceBtn: document.getElementById("rollDiceBtn"),
  actionButtons: document.getElementById("actionButtons"),
  propertyPanel: document.getElementById("propertyPanel"),
  cardDisplay: document.getElementById("cardDisplay"),
  drawnCard: document.getElementById("drawnCard"),
  playersStatus: document.getElementById("playersStatus"),
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

function generateRoomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function setStatus(text) { ui.connectionStatus.textContent = text; }

function setMode(nextMode) {
  mode = nextMode;
  ui.modeButtons.forEach((b) => {
    const active = b.dataset.mode === nextMode;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", active ? "true" : "false");
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

function formatMoney(amount) {
  return `₹${Math.abs(amount).toLocaleString("en-IN")}`;
}

// ================================================
// Board Rendering
// ================================================
function getSpaceCoords(index) {
  // Board is 680x680 in SVG viewBox (100x100 scaled)
  // 11 spaces on each side: corner + 9 + corner
  // Corner spaces are larger
  const size = 100;
  const cornerSize = 14;
  const sideSpaces = 9;
  const spaceWidth = (size - 2 * cornerSize) / sideSpaces;
  const spaceHeight = cornerSize;

  // Bottom row: 0 is bottom-right corner, 10 is bottom-left
  if (index >= 0 && index <= 10) {
    const i = index;
    if (i === 0) return { x: size - cornerSize, y: size - cornerSize, w: cornerSize, h: cornerSize, side: "corner" };
    if (i === 10) return { x: 0, y: size - cornerSize, w: cornerSize, h: cornerSize, side: "corner" };
    const x = size - cornerSize - i * spaceWidth;
    return { x, y: size - spaceHeight, w: spaceWidth, h: spaceHeight, side: "bottom" };
  }

  // Left column: 11-19, bottom to top
  if (index >= 11 && index <= 19) {
    const i = index - 11;
    const y = size - cornerSize - (i + 1) * spaceWidth;
    return { x: 0, y, w: spaceHeight, h: spaceWidth, side: "left" };
  }

  // Top row: 20 is top-left, 30 is top-right
  if (index >= 20 && index <= 30) {
    const i = index - 20;
    if (i === 0) return { x: 0, y: 0, w: cornerSize, h: cornerSize, side: "corner" };
    if (i === 10) return { x: size - cornerSize, y: 0, w: cornerSize, h: cornerSize, side: "corner" };
    const x = cornerSize + (i - 1) * spaceWidth;
    return { x, y: 0, w: spaceWidth, h: spaceHeight, side: "top" };
  }

  // Right column: 31-39, top to bottom
  if (index >= 31 && index <= 39) {
    const i = index - 31;
    const y = cornerSize + i * spaceWidth;
    return { x: size - spaceHeight, y, w: spaceHeight, h: spaceWidth, side: "right" };
  }

  return { x: 0, y: 0, w: 0, h: 0, side: "" };
}

function getPlayerTokenPos(spaceIndex, playerIdx, totalPlayers) {
  const coords = getSpaceCoords(spaceIndex);
  const cx = coords.x + coords.w / 2;
  const cy = coords.y + coords.h / 2;

  // Offset multiple tokens so they don't overlap
  const cols = Math.min(totalPlayers, 3);
  const rows = Math.ceil(totalPlayers / cols);
  const col = playerIdx % cols;
  const row = Math.floor(playerIdx / cols);

  const spacing = 2.2;
  const offsetX = (col - (cols - 1) / 2) * spacing;
  const offsetY = (row - (rows - 1) / 2) * spacing;

  return { x: cx + offsetX, y: cy + offsetY };
}

function renderBoard(state) {
  const container = ui.boardContainer;
  container.innerHTML = "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("class", "board-svg");

  // Board background
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", "100");
  bg.setAttribute("height", "100");
  bg.setAttribute("fill", "#1a1a2e");
  bg.setAttribute("rx", "1.5");
  svg.appendChild(bg);

  // Center area
  const center = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  center.setAttribute("x", "14");
  center.setAttribute("y", "14");
  center.setAttribute("width", "72");
  center.setAttribute("height", "72");
  center.setAttribute("fill", "rgba(30, 30, 30, 0.6)");
  center.setAttribute("rx", "1");
  svg.appendChild(center);

  // Center text
  const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  titleText.setAttribute("x", "50");
  titleText.setAttribute("y", "46");
  titleText.setAttribute("text-anchor", "middle");
  titleText.setAttribute("font-size", "6");
  titleText.setAttribute("font-weight", "900");
  titleText.setAttribute("fill", "#30d158");
  titleText.setAttribute("letter-spacing", "0.3");
  titleText.textContent = "BUSINESS";
  svg.appendChild(titleText);

  const subText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  subText.setAttribute("x", "50");
  subText.setAttribute("y", "53");
  subText.setAttribute("text-anchor", "middle");
  subText.setAttribute("font-size", "2.2");
  subText.setAttribute("fill", "rgba(255,255,255,0.4)");
  subText.textContent = "Indian Property Trading Game";
  svg.appendChild(subText);

  // Draw all 40 spaces
  for (let i = 0; i < BOARD_SIZE; i++) {
    const space = BOARD[i];
    const coords = getSpaceCoords(i);

    // Space background
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", coords.x + 0.15);
    rect.setAttribute("y", coords.y + 0.15);
    rect.setAttribute("width", coords.w - 0.3);
    rect.setAttribute("height", coords.h - 0.3);
    rect.setAttribute("fill", "rgba(255,255,255,0.04)");
    rect.setAttribute("stroke", "rgba(255,255,255,0.12)");
    rect.setAttribute("stroke-width", "0.15");
    rect.setAttribute("rx", "0.4");

    // Highlight current player's space
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer && currentPlayer.position === i && !currentPlayer.bankrupt) {
      rect.setAttribute("fill", "rgba(48, 209, 88, 0.15)");
      rect.setAttribute("stroke", "rgba(48, 209, 88, 0.5)");
    }

    svg.appendChild(rect);

    // Color strip for property groups
    if (space.type === "property" && space.group) {
      const color = GROUP_COLORS[space.group];
      const strip = document.createElementNS("http://www.w3.org/2000/svg", "rect");

      if (coords.side === "bottom") {
        strip.setAttribute("x", coords.x + 0.15);
        strip.setAttribute("y", coords.y + 0.15);
        strip.setAttribute("width", coords.w - 0.3);
        strip.setAttribute("height", "2");
      } else if (coords.side === "top") {
        strip.setAttribute("x", coords.x + 0.15);
        strip.setAttribute("y", coords.y + coords.h - 2.15);
        strip.setAttribute("width", coords.w - 0.3);
        strip.setAttribute("height", "2");
      } else if (coords.side === "left") {
        strip.setAttribute("x", coords.x + coords.w - 2.15);
        strip.setAttribute("y", coords.y + 0.15);
        strip.setAttribute("width", "2");
        strip.setAttribute("height", coords.h - 0.3);
      } else if (coords.side === "right") {
        strip.setAttribute("x", coords.x + 0.15);
        strip.setAttribute("y", coords.y + 0.15);
        strip.setAttribute("width", "2");
        strip.setAttribute("height", coords.h - 0.3);
      }

      strip.setAttribute("fill", color);
      strip.setAttribute("rx", "0.3");
      strip.setAttribute("fill-opacity", "0.8");
      svg.appendChild(strip);
    }

    // Space name text
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", coords.side === "corner" ? "1.6" : "1.35");
    text.setAttribute("font-weight", "600");
    text.setAttribute("fill", "rgba(255,255,255,0.65)");

    const cx = coords.x + coords.w / 2;
    const cy = coords.y + coords.h / 2;

    // Corner labels
    if (coords.side === "corner") {
      text.setAttribute("x", cx);
      text.setAttribute("y", cy + 0.5);
      if (space.type === "go") text.textContent = "START";
      else if (space.type === "jail") text.textContent = "JAIL";
      else if (space.type === "rest_house") text.textContent = "REST";
      else if (space.type === "go_to_jail") text.textContent = "GO JAIL";
    } else {
      // Truncate long names
      let label = space.name;
      if (label.length > 8) label = label.slice(0, 7) + ".";

      if (space.type === "chance") label = "CHANCE";
      else if (space.type === "community") label = "CHEST";
      else if (space.type === "tax") label = "TAX";
      else if (space.type === "wealth_tax") label = "W.TAX";
      else if (space.type === "rest_house") label = "REST";

      text.setAttribute("x", cx);
      text.setAttribute("y", cy + 0.5);
      text.textContent = label;
    }

    svg.appendChild(text);

    // Price text for buyable properties
    if (["property", "transport", "utility"].includes(space.type)) {
      const prop = state.properties[i];
      const priceText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      priceText.setAttribute("text-anchor", "middle");
      priceText.setAttribute("font-size", "1.1");
      priceText.setAttribute("font-weight", "500");
      priceText.setAttribute("x", cx);

      if (coords.side === "bottom") priceText.setAttribute("y", cy + 3.5);
      else if (coords.side === "top") priceText.setAttribute("y", cy - 2);
      else if (coords.side === "left") priceText.setAttribute("y", cy + 3);
      else if (coords.side === "right") priceText.setAttribute("y", cy + 3);
      else priceText.setAttribute("y", cy + 3);

      if (prop && prop.ownerId) {
        const ownerIdx = state.players.findIndex((p) => p.id === prop.ownerId);
        if (ownerIdx >= 0) {
          priceText.setAttribute("fill", PLAYER_COLORS[ownerIdx].main);
          priceText.textContent = prop.mortgaged ? "MTG" : state.players[ownerIdx].name.slice(0, 5);
        }
      } else {
        priceText.setAttribute("fill", "rgba(255,214,10,0.5)");
        priceText.textContent = `₹${space.price}`;
      }

      svg.appendChild(priceText);

      // Draw houses
      if (prop && prop.houses > 0 && !prop.mortgaged) {
        const houseY = coords.side === "bottom" ? coords.y + 0.5 :
                       coords.side === "top" ? coords.y + coords.h - 1.5 :
                       coords.y + 0.5;
        const houseX = coords.side === "left" ? coords.x + coords.w - 2.5 :
                       coords.side === "right" ? coords.x + 0.5 :
                       coords.x + 0.5;

        if (prop.houses === HOTEL_LEVEL) {
          // Hotel
          const hotel = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          hotel.setAttribute("x", cx - 1.5);
          hotel.setAttribute("y", coords.side === "bottom" ? coords.y + 2.5 : coords.side === "top" ? coords.y + coords.h - 3.5 : cy - 1);
          hotel.setAttribute("width", "3");
          hotel.setAttribute("height", "1.5");
          hotel.setAttribute("rx", "0.3");
          hotel.setAttribute("fill", "#ff453a");
          svg.appendChild(hotel);
        } else {
          for (let h = 0; h < prop.houses; h++) {
            const house = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            const hx = (coords.side === "bottom" || coords.side === "top")
              ? coords.x + 1 + h * (coords.w - 2) / 4
              : (coords.side === "left" ? coords.x + coords.w - 2.5 : coords.x + 0.5);
            const hy = (coords.side === "left" || coords.side === "right")
              ? coords.y + 1 + h * (coords.h - 2) / 4
              : (coords.side === "bottom" ? coords.y + 2.5 : coords.y + coords.h - 3.5);

            house.setAttribute("x", hx);
            house.setAttribute("y", hy);
            house.setAttribute("width", "1.2");
            house.setAttribute("height", "1");
            house.setAttribute("rx", "0.2");
            house.setAttribute("fill", "#30d158");
            svg.appendChild(house);
          }
        }
      }
    }
  }

  // Draw player tokens
  for (let pi = 0; pi < state.players.length; pi++) {
    const player = state.players[pi];
    if (player.bankrupt) continue;

    const pos = getPlayerTokenPos(player.position, pi, state.players.filter((p) => !p.bankrupt).length);
    const color = PLAYER_COLORS[pi];

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Token glow for current player
    if (pi === state.currentPlayerIndex) {
      const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      glow.setAttribute("cx", pos.x);
      glow.setAttribute("cy", pos.y);
      glow.setAttribute("r", "2.2");
      glow.setAttribute("fill", color.main);
      glow.setAttribute("fill-opacity", "0.3");
      g.appendChild(glow);
    }

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", pos.x);
    circle.setAttribute("cy", pos.y);
    circle.setAttribute("r", "1.5");
    circle.setAttribute("fill", color.main);
    circle.setAttribute("stroke", "#fff");
    circle.setAttribute("stroke-width", "0.2");
    g.appendChild(circle);

    // Player initial
    const initial = document.createElementNS("http://www.w3.org/2000/svg", "text");
    initial.setAttribute("x", pos.x);
    initial.setAttribute("y", pos.y + 0.5);
    initial.setAttribute("text-anchor", "middle");
    initial.setAttribute("dominant-baseline", "middle");
    initial.setAttribute("font-size", "1.4");
    initial.setAttribute("font-weight", "800");
    initial.setAttribute("fill", "#fff");
    initial.setAttribute("pointer-events", "none");
    initial.textContent = player.name[0].toUpperCase();
    g.appendChild(initial);

    svg.appendChild(g);
  }

  container.appendChild(svg);
}

// ================================================
// Dice Rendering
// ================================================
const DICE_DOTS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function renderDie(el, value) {
  if (value <= 0) {
    el.innerHTML = "";
    el.classList.remove("rolled");
    return;
  }
  el.classList.add("rolled");
  const dots = DICE_DOTS[value] || [];
  let html = `<svg viewBox="0 0 100 100" style="width:100%;height:100%">`;
  for (const [cx, cy] of dots) {
    html += `<circle cx="${cx}" cy="${cy}" r="10" fill="#fff"/>`;
  }
  html += `</svg>`;
  el.innerHTML = html;
}

// ================================================
// Render
// ================================================
function render() {
  const state = currentState();
  if (!state) {
    ui.gamePanel.classList.add("hidden");
    ui.winnerBanner.classList.add("hidden");
    return;
  }

  ui.gamePanel.classList.remove("hidden");

  const viewingId = currentViewingPlayerId(state);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === viewingId;

  // Turn info
  ui.turnName.textContent = isMyTurn ? "Your Turn" : `${currentPlayer?.name || "?"}'s Turn`;
  ui.turnCard.classList.toggle("my-turn", isMyTurn);

  if (notice) {
    ui.turnHint.textContent = notice;
  } else if (state.phase === "finished") {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.turnHint.textContent = winner ? `${winner.name} wins!` : "Game over.";
  } else if (currentPlayer?.inJail && isMyTurn) {
    ui.turnHint.textContent = `You're in Jail! Pay ₹${JAIL_FINE} fine, use card, or try rolling doubles.`;
  } else if (state.turnPhase === "pre_roll" && isMyTurn && !currentPlayer?.started) {
    ui.turnHint.textContent = "Roll 12 (double sixes) to start!";
  } else if (state.turnPhase === "pre_roll" && isMyTurn && currentPlayer?.skipNextTurn) {
    ui.turnHint.textContent = "Resting... (skipping this turn)";
  } else if (state.turnPhase === "pre_roll" && isMyTurn) {
    ui.turnHint.textContent = "Roll the dice!";
  } else if (state.turnPhase === "awaiting_buy" && isMyTurn) {
    ui.turnHint.textContent = `Buy ${BOARD[currentPlayer.position].name}?`;
  } else if (state.turnPhase === "post_roll" && isMyTurn) {
    ui.turnHint.textContent = "End turn or manage properties.";
  } else if (!isMyTurn) {
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

  // Dice
  renderDie(ui.die1, state.dice[0]);
  renderDie(ui.die2, state.dice[1]);

  ui.rollDiceBtn.disabled = !(isMyTurn && state.turnPhase === "pre_roll" && state.phase === "playing");

  // Action buttons
  ui.actionButtons.innerHTML = "";

  if (isMyTurn && state.phase === "playing") {
    // Jail actions (before roll)
    if (currentPlayer.inJail && state.turnPhase === "pre_roll") {
      if (currentPlayer.jailFreeCards > 0) {
        const btn = document.createElement("button");
        btn.className = "jail-btn";
        btn.textContent = "Use Get Out of Jail Card";
        btn.addEventListener("click", () => dispatchAction({ type: "use_jail_card", playerId: viewingId }));
        ui.actionButtons.appendChild(btn);
      }
      if (currentPlayer.money >= JAIL_FINE) {
        const btn = document.createElement("button");
        btn.className = "jail-btn";
        btn.textContent = `Pay ₹${JAIL_FINE} Fine`;
        btn.addEventListener("click", () => dispatchAction({ type: "pay_jail_fine", playerId: viewingId }));
        ui.actionButtons.appendChild(btn);
      }
    }

    // Buy/pass
    if (state.turnPhase === "awaiting_buy") {
      const space = BOARD[currentPlayer.position];
      const buyBtn = document.createElement("button");
      buyBtn.className = "buy-btn";
      buyBtn.textContent = `Buy ${space.name} (${formatMoney(space.price)})`;
      buyBtn.disabled = currentPlayer.money < space.price;
      buyBtn.addEventListener("click", () => dispatchAction({ type: "buy_property", playerId: viewingId }));
      ui.actionButtons.appendChild(buyBtn);

      const passBtn = document.createElement("button");
      passBtn.className = "pass-btn";
      passBtn.textContent = "Pass";
      passBtn.addEventListener("click", () => dispatchAction({ type: "decline_property", playerId: viewingId }));
      ui.actionButtons.appendChild(passBtn);
    }

    // End turn
    if (state.turnPhase === "post_roll") {
      const endBtn = document.createElement("button");
      endBtn.className = "end-turn-btn";
      endBtn.textContent = "End Turn";
      endBtn.addEventListener("click", () => dispatchAction({ type: "end_turn", playerId: viewingId }));
      ui.actionButtons.appendChild(endBtn);
    }

    // Bankruptcy
    if (currentPlayer.money < 0) {
      const bankBtn = document.createElement("button");
      bankBtn.className = "danger";
      bankBtn.textContent = "Declare Bankruptcy";
      bankBtn.addEventListener("click", () => dispatchAction({ type: "declare_bankruptcy", playerId: viewingId }));
      ui.actionButtons.appendChild(bankBtn);
    }
  }

  // Property panel — show owned properties for viewing player
  renderPropertyPanel(state, viewingId);

  // Card display
  if (state.lastCard) {
    ui.cardDisplay.classList.remove("hidden");
    ui.drawnCard.textContent = state.lastCard.text;
  } else {
    ui.cardDisplay.classList.add("hidden");
  }

  // Player status bar
  ui.playersStatus.innerHTML = "";
  for (let pi = 0; pi < state.players.length; pi++) {
    const player = state.players[pi];
    const color = PLAYER_COLORS[pi];
    const isCurrent = pi === state.currentPlayerIndex;

    // Count properties
    let propCount = 0;
    for (let i = 0; i < BOARD.length; i++) {
      if (state.properties[i]?.ownerId === player.id) propCount++;
    }

    const div = document.createElement("div");
    div.className = `player-status ${isCurrent ? "active" : ""} ${player.bankrupt ? "bankrupt" : ""}`;
    div.style.setProperty("--player-color", color.main);
    div.style.setProperty("--player-dim", color.dim);

    div.innerHTML = `
      <div class="ps-color" style="background:${color.main}"></div>
      <div class="ps-info">
        <div class="ps-name">${player.name}${player.inJail ? " (Jail)" : ""}</div>
        <div class="ps-money">${player.bankrupt ? "BANKRUPT" : formatMoney(player.money)}</div>
        <div class="ps-props">${propCount} properties</div>
      </div>
    `;
    ui.playersStatus.appendChild(div);
  }

  // Render board
  renderBoard(state);

  // Logs
  ui.sidebarLogs.innerHTML = "";
  (state.log || []).forEach((entry) => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.textContent = entry;
    ui.sidebarLogs.appendChild(div);
  });

  // Auto-end turn for human when there's nothing to do (e.g., failed roll-to-start)
  if (mode === "local" && state.phase === "playing" && isMyTurn && state.turnPhase === "post_roll" && !currentPlayer.started) {
    if (botTimeout) clearTimeout(botTimeout);
    botTimeout = setTimeout(() => {
      if (!localState || localState.phase !== "playing") return;
      dispatchAction({ type: "end_turn", playerId: viewingId });
    }, 400);
  }
  // Bot automation
  else if (mode === "local" && state.phase === "playing") {
    const cp = state.players[state.currentPlayerIndex];
    if (cp && (cp.isBot || (cp.id === viewingId && autoPlay))) {
      if (botTimeout) clearTimeout(botTimeout);
      // Faster during pre-start phase (nothing interesting is happening)
      const preStart = !cp.started;
      const delay = cp.isBot ? (preStart ? 400 : 1200) : 600;
      botTimeout = setTimeout(() => {
        if (!localState || localState.phase !== "playing") return;
        const botAction = getBotMove(localState, localState.currentPlayerIndex);
        if (botAction) dispatchAction(botAction);
      }, delay);
    }
  }
}

function renderPropertyPanel(state, viewingId) {
  ui.propertyPanel.innerHTML = "";

  const myPlayer = state.players.find((p) => p.id === viewingId);
  if (!myPlayer || myPlayer.bankrupt) return;

  const isMyTurn = state.players[state.currentPlayerIndex]?.id === viewingId;

  for (let i = 0; i < BOARD.length; i++) {
    const prop = state.properties[i];
    if (!prop || prop.ownerId !== viewingId) continue;

    const space = BOARD[i];
    const div = document.createElement("div");
    div.className = `prop-item ${prop.mortgaged ? "mortgaged" : ""}`;

    const colorHex = space.group ? GROUP_COLORS[space.group] :
                     space.type === "transport" ? "#888" : "#4488aa";

    let housesHtml = "";
    if (space.type === "property" && prop.houses > 0) {
      if (prop.houses === HOTEL_LEVEL) {
        housesHtml = `<div class="prop-houses"><div class="hotel-dot"></div></div>`;
      } else {
        housesHtml = `<div class="prop-houses">${Array(prop.houses).fill('<div class="house-dot"></div>').join("")}</div>`;
      }
    }

    div.innerHTML = `
      <div class="prop-color" style="background:${colorHex}"></div>
      <div class="prop-name">${space.name}</div>
      ${housesHtml}
      <div class="prop-detail">${prop.mortgaged ? "MTG" : ""}</div>
    `;

    // Add build/mortgage buttons on hover/click
    div.addEventListener("click", () => {
      // Toggle expanded actions
      const existing = div.querySelector(".prop-actions");
      if (existing) {
        existing.remove();
        return;
      }

      const actions = document.createElement("div");
      actions.className = "prop-actions";

      if (isMyTurn && space.type === "property" && !prop.mortgaged && ownsFullGroup(state, viewingId, space.group) && prop.houses < HOTEL_LEVEL) {
        const cost = COLOR_GROUPS[space.group].houseCost;
        const buildBtn = document.createElement("button");
        buildBtn.className = "primary";
        buildBtn.textContent = `Build (${formatMoney(cost)})`;
        buildBtn.disabled = myPlayer.money < cost;
        buildBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          dispatchAction({ type: "build_house", playerId: viewingId, spaceIndex: i });
        });
        actions.appendChild(buildBtn);
      }

      if (space.type === "property" && prop.houses > 0) {
        const sellBtn = document.createElement("button");
        sellBtn.textContent = "Sell House";
        sellBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          dispatchAction({ type: "sell_house", playerId: viewingId, spaceIndex: i });
        });
        actions.appendChild(sellBtn);
      }

      if (!prop.mortgaged && prop.houses === 0) {
        const mtgBtn = document.createElement("button");
        mtgBtn.textContent = "Mortgage";
        mtgBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          dispatchAction({ type: "mortgage_property", playerId: viewingId, spaceIndex: i });
        });
        actions.appendChild(mtgBtn);
      }

      if (prop.mortgaged) {
        const cost = Math.floor(space.price / 2 * 1.1);
        const unmtgBtn = document.createElement("button");
        unmtgBtn.textContent = `Unmortgage (${formatMoney(cost)})`;
        unmtgBtn.disabled = myPlayer.money < cost;
        unmtgBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          dispatchAction({ type: "unmortgage_property", playerId: viewingId, spaceIndex: i });
        });
        actions.appendChild(unmtgBtn);
      }

      if (actions.children.length > 0) {
        div.appendChild(actions);
      }
    });

    ui.propertyPanel.appendChild(div);
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

  const botNames = ["Ravi Bot", "Priya Bot", "Arjun Bot", "Meera Bot", "Kiran Bot"];
  const players = [];

  if (!isSpectator) {
    players.push({ id: "p1", name, isBot: false });
  }

  for (let i = 0; i < botCount; i++) {
    players.push({ id: `bot${i + 1}`, name: botNames[i % botNames.length], isBot: true });
  }

  if (players.length < 2) {
    players.push({ id: "bot_extra", name: "Extra Bot", isBot: true });
  }

  while (players.length > 6) players.pop();

  notice = null;
  localState = createGame({ players });
  myPlayerId = isSpectator ? null : "p1";
  setStatus(isSpectator ? "Spectating" : "Single Player");
  ui.setupPanel.classList.add("hidden");
  render();
}

function resetToSetup() {
  if (botTimeout) clearTimeout(botTimeout);
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
    socket.send(JSON.stringify({ type: "hello", name, room: code, create, gameType: "business" }));
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
      message.players.forEach((p) => {
        const line = document.createElement("div");
        line.textContent = p.name + (p.isBot ? " (Bot)" : "");
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
ui.modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

ui.playerMinus.addEventListener("click", () => {
  const count = Math.max(1, Number(ui.playerCount.textContent) - 1);
  ui.playerCount.textContent = String(count);
});

ui.playerPlus.addEventListener("click", () => {
  const count = Math.min(5, Number(ui.playerCount.textContent) + 1);
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

ui.rollDiceBtn.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "playing" || state.turnPhase !== "pre_roll") return;
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
  document.querySelector(".business-app").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".business-app").classList.remove("sidebar-open");
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
