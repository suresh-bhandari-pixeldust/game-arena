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
  scoreboard: document.getElementById("scoreboard"),
  scoreP1Name: document.getElementById("scoreP1Name"),
  scoreP1Runs: document.getElementById("scoreP1Runs"),
  scoreP2Name: document.getElementById("scoreP2Name"),
  scoreP2Runs: document.getElementById("scoreP2Runs"),
  inningsInfo: document.getElementById("inningsInfo"),
  targetInfo: document.getElementById("targetInfo"),
  tossArea: document.getElementById("tossArea"),
  tossPrompt: document.getElementById("tossPrompt"),
  tossOddBtn: document.getElementById("tossOddBtn"),
  tossEvenBtn: document.getElementById("tossEvenBtn"),
  batOrBowlArea: document.getElementById("batOrBowlArea"),
  batOrBowlPrompt: document.getElementById("batOrBowlPrompt"),
  chooseBat: document.getElementById("chooseBat"),
  chooseBowl: document.getElementById("chooseBowl"),
  numberPicker: document.getElementById("numberPicker"),
  numberPickerTitle: document.getElementById("numberPickerTitle"),
  numberButtons: document.getElementById("numberButtons"),
  revealArea: document.getElementById("revealArea"),
  revealBatterName: document.getElementById("revealBatterName"),
  revealBatterNum: document.getElementById("revealBatterNum"),
  revealBowlerName: document.getElementById("revealBowlerName"),
  revealBowlerNum: document.getElementById("revealBowlerNum"),
  revealResult: document.getElementById("revealResult"),
  revealRunsScored: document.getElementById("revealRunsScored"),
  continueBtn: document.getElementById("continueBtn"),
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
let actionTimeout = null;
let showingReveal = false; // pause between balls to show reveal

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
// Hand SVG generator (show fingers 1-6)
// ================================================
function handSVG(number, accentColor) {
  const c = accentColor || "#fff";
  // Simple fist with fingers extended
  const fingers = [];
  const positions = [
    { x: 20, label: "1" },
    { x: 30, label: "2" },
    { x: 40, label: "3" },
    { x: 50, label: "4" },
    { x: 60, label: "5" },
  ];

  // Draw palm
  let svg = `<svg viewBox="0 0 80 80" fill="none">`;
  svg += `<rect x="20" y="40" width="45" height="30" rx="8" fill="${c}" opacity="0.2"/>`;

  // Draw fingers (up to 5 upright, 6th is thumb)
  const show = Math.min(number, 5);
  for (let i = 0; i < show; i++) {
    const px = positions[i];
    svg += `<rect x="${px.x}" y="12" width="8" height="32" rx="4" fill="${c}" opacity="0.5"/>`;
  }
  // Thumb for 6
  if (number === 6) {
    svg += `<rect x="10" y="35" width="14" height="8" rx="4" fill="${c}" opacity="0.5" transform="rotate(-30 10 35)"/>`;
  }

  svg += `</svg>`;
  return svg;
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
  const opponent = state.players.find((p) => p.id !== viewingPlayerId);

  // Scoreboard
  ui.scoreP1Name.textContent = state.players[0].name;
  ui.scoreP1Runs.textContent = String(state.players[0].score);
  ui.scoreP2Name.textContent = state.players[1].name;
  ui.scoreP2Runs.textContent = String(state.players[1].score);

  // Batting indicator
  if (state.currentBatterId) {
    const batterEl = state.currentBatterId === state.players[0].id ? ui.scoreP1Name : ui.scoreP2Name;
    const bowlerEl = state.currentBatterId === state.players[0].id ? ui.scoreP2Name : ui.scoreP1Name;
    batterEl.classList.add("is-batting");
    bowlerEl.classList.remove("is-batting");
    bowlerEl.classList.add("is-bowling");
    batterEl.classList.remove("is-bowling");
  } else {
    ui.scoreP1Name.classList.remove("is-batting", "is-bowling");
    ui.scoreP2Name.classList.remove("is-batting", "is-bowling");
  }

  // Innings and target info
  if (state.innings === 0) {
    ui.inningsInfo.textContent = "Toss";
  } else if (state.innings === 1) {
    ui.inningsInfo.textContent = "1st Innings";
  } else {
    ui.inningsInfo.textContent = "2nd Innings";
  }

  if (state.target) {
    ui.targetInfo.textContent = `Target: ${state.target}`;
    ui.targetInfo.classList.remove("hidden");
  } else {
    ui.targetInfo.classList.add("hidden");
  }

  // Turn info
  const isMyTurn = me && needsInput(state, me.id);
  ui.turnCard.classList.toggle("my-turn", isMyTurn);

  if (state.phase === "finished") {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.turnName.textContent = "Match Over";
    ui.turnHint.textContent = winner ? `${winner.name} wins!` : "Match drawn.";
  } else if (showingReveal && state.balls.length > 0) {
    const lb = state.balls[state.balls.length - 1];
    ui.turnName.textContent = "Ball Result";
    ui.turnHint.textContent = lb.result === "out" ? "OUT!" : `+${lb.runsScored} runs`;
  } else if (state.phase === "toss_choose") {
    if (me && me.id === state.tossCallerId) {
      ui.turnName.textContent = "Your Call";
      ui.turnHint.textContent = "Call Odd or Even for the toss";
    } else {
      const caller = state.players.find((p) => p.id === state.tossCallerId);
      ui.turnName.textContent = "Toss";
      ui.turnHint.textContent = `${caller?.name} is calling...`;
    }
  } else if (state.phase === "toss_flip") {
    ui.turnName.textContent = "Toss";
    if (me && state.pendingNumbers[me.id] !== undefined) {
      ui.turnHint.textContent = "Waiting for opponent...";
    } else {
      ui.turnHint.textContent = "Pick a number for the toss!";
    }
  } else if (state.phase === "bat_or_bowl") {
    if (me && me.id === state.tossWinnerId) {
      ui.turnName.textContent = "You Won the Toss!";
      ui.turnHint.textContent = "Choose to bat or bowl";
    } else {
      const winner = state.players.find((p) => p.id === state.tossWinnerId);
      ui.turnName.textContent = `${winner?.name} Won the Toss`;
      ui.turnHint.textContent = "Waiting for their choice...";
    }
  } else if (state.phase === "batting" || state.phase === "chasing") {
    if (me && state.pendingNumbers[me.id] !== undefined) {
      ui.turnName.textContent = "Number Picked!";
      ui.turnHint.textContent = "Waiting for opponent...";
    } else if (isMyTurn) {
      const isBatting = me && me.id === state.currentBatterId;
      ui.turnName.textContent = isBatting ? "You're Batting" : "You're Bowling";
      ui.turnHint.textContent = "Pick a number 1-6!";
    } else {
      ui.turnName.textContent = "Waiting...";
      ui.turnHint.textContent = "Both players picking numbers...";
    }
  }

  // Winner banner
  if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.winnerBanner.classList.remove("hidden");
    ui.winnerName.textContent = `${winner?.name || "Someone"} Wins!`;
  } else {
    ui.winnerBanner.classList.add("hidden");
  }

  // ─── Show/hide interaction areas ───

  // Toss call (odd/even)
  if (state.phase === "toss_choose" && !showingReveal) {
    ui.tossArea.classList.remove("hidden");
    const isCaller = me && me.id === state.tossCallerId;
    ui.tossOddBtn.disabled = !isCaller;
    ui.tossEvenBtn.disabled = !isCaller;
    ui.tossPrompt.textContent = isCaller
      ? "Call Odd or Even:"
      : `Waiting for ${state.players.find((p) => p.id === state.tossCallerId)?.name}...`;
  } else {
    ui.tossArea.classList.add("hidden");
  }

  // Number picker for toss flip
  if (state.phase === "toss_flip" && !showingReveal) {
    const alreadyPicked = me && state.pendingNumbers[me.id] !== undefined;
    ui.numberPicker.classList.remove("hidden");
    ui.numberPickerTitle.textContent = "Pick a number for the toss:";
    setNumberButtonsState(!alreadyPicked && me !== undefined);
  } else if ((state.phase === "batting" || state.phase === "chasing") && !showingReveal) {
    const alreadyPicked = me && state.pendingNumbers[me.id] !== undefined;
    ui.numberPicker.classList.remove("hidden");
    const isBatting = me && me.id === state.currentBatterId;
    ui.numberPickerTitle.textContent = isBatting ? "Batting - Pick your runs:" : "Bowling - Pick a number:";
    setNumberButtonsState(!alreadyPicked && me !== undefined);
  } else {
    ui.numberPicker.classList.add("hidden");
  }

  // Bat or bowl choice
  if (state.phase === "bat_or_bowl" && !showingReveal) {
    ui.batOrBowlArea.classList.remove("hidden");
    const isWinner = me && me.id === state.tossWinnerId;
    ui.chooseBat.disabled = !isWinner;
    ui.chooseBowl.disabled = !isWinner;
    const winner = state.players.find((p) => p.id === state.tossWinnerId);
    ui.batOrBowlPrompt.textContent = isWinner
      ? "You won the toss! Choose:"
      : `${winner?.name} is choosing...`;
  } else {
    ui.batOrBowlArea.classList.add("hidden");
  }

  // Reveal area (last ball result)
  const lastBall = state.balls.length > 0 ? state.balls[state.balls.length - 1] : null;
  if (showingReveal && lastBall) {
    ui.revealArea.classList.remove("hidden");

    const bName = state.players.find((p) => p.id === lastBall.batterId);
    const bowlName = state.players.find((p) => p.id === lastBall.bowlerId);
    ui.revealBatterName.textContent = bName?.name || "Batter";
    ui.revealBatterNum.textContent = String(lastBall.batterNum);
    ui.revealBowlerName.textContent = bowlName?.name || "Bowler";
    ui.revealBowlerNum.textContent = String(lastBall.bowlerNum);

    if (lastBall.result === "out") {
      ui.revealResult.textContent = "OUT!";
      ui.revealResult.className = "reveal-result out";
      ui.revealRunsScored.textContent = `${bName?.name} is out!`;
    } else {
      ui.revealResult.textContent = `+${lastBall.runsScored}`;
      ui.revealResult.className = "reveal-result scored";
      ui.revealRunsScored.textContent = `${bName?.name} scores ${lastBall.runsScored}`;
    }

    // Auto-continue if game is finished or show continue button
    if (state.phase === "finished") {
      ui.continueBtn.classList.add("hidden");
    } else {
      ui.continueBtn.classList.remove("hidden");
    }
  } else {
    ui.revealArea.classList.add("hidden");
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
  if (mode === "local" && !showingReveal && state.phase !== "finished") {
    scheduleBotMoves();
  }
}

function needsInput(state, playerId) {
  if (state.phase === "toss_choose" && playerId === state.tossCallerId) return true;
  if (state.phase === "toss_flip" && state.pendingNumbers[playerId] === undefined) return true;
  if (state.phase === "bat_or_bowl" && playerId === state.tossWinnerId) return true;
  if ((state.phase === "batting" || state.phase === "chasing") && state.pendingNumbers[playerId] === undefined) return true;
  return false;
}

function setNumberButtonsState(enabled) {
  const btns = ui.numberButtons.querySelectorAll(".num-btn");
  btns.forEach((btn) => {
    btn.disabled = !enabled;
  });
}

// ================================================
// Bot Scheduling
// ================================================
function scheduleBotMoves() {
  if (actionTimeout) clearTimeout(actionTimeout);

  const state = currentState();
  if (!state || state.phase === "finished") return;

  // Check each player for bot moves needed
  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    if (p.isBot && needsInput(state, p.id)) {
      actionTimeout = setTimeout(() => {
        if (!localState) return;
        const move = getBotMove(localState, i);
        if (move) dispatchAction(move);
      }, 800 + Math.random() * 400);
      return; // one at a time
    }
  }

  // Auto-play for human
  if (autoPlay) {
    const viewingId = currentViewingPlayerId(state);
    if (viewingId && needsInput(state, viewingId)) {
      const idx = state.players.findIndex((p) => p.id === viewingId);
      actionTimeout = setTimeout(() => {
        if (!localState) return;
        const move = getBotMove(localState, idx);
        if (move) dispatchAction(move);
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
    showNotice("Start a match first.");
    return;
  }

  if (actionTimeout) clearTimeout(actionTimeout);
  clearNotice();

  const prevBalls = localState.balls.length;
  const prevPhase = localState.phase;
  const result = applyAction(localState, action);
  if (result.error) {
    showNotice(result.error);
    return;
  }
  localState = result.state;

  // Show reveal animation when a ball is completed
  const newBallAdded = localState.balls.length > prevBalls;
  if (newBallAdded) {
    showingReveal = true;
    render();

    // Auto-dismiss reveal after delay
    if (actionTimeout) clearTimeout(actionTimeout);

    const delay = localState.lastResult === "out" ? 2500 : 1500;
    actionTimeout = setTimeout(() => {
      showingReveal = false;
      render();
    }, delay);
    return;
  }

  // If toss was resolved (phase changed from toss_flip to bat_or_bowl), brief pause
  if (prevPhase === "toss_flip" && localState.phase === "bat_or_bowl") {
    showingReveal = false;
    render();

    // Schedule bot to pick bat/bowl
    if (actionTimeout) clearTimeout(actionTimeout);
    scheduleBotMoves();
    return;
  }

  render();
}

// ================================================
// Game Setup
// ================================================
function startLocalGame() {
  const name = document.getElementById("localName").value.trim() || "Player";
  const isSpectator = ui.localSpectator.checked;

  const botNames = ["Sachin", "Virat", "Dhoni", "Rohit", "Bumrah", "Kohli"];

  const players = [];
  if (!isSpectator) {
    players.push({ id: "p1", name, isBot: false });
    players.push({ id: "bot1", name: `${botNames[0]} (Bot)`, isBot: true });
  } else {
    players.push({ id: "bot1", name: `${botNames[0]} (Bot)`, isBot: true });
    players.push({ id: "bot2", name: `${botNames[1]} (Bot)`, isBot: true });
  }

  notice = null;
  showingReveal = false;
  localState = createGame({ players });
  myPlayerId = isSpectator ? null : "p1";
  setStatus(isSpectator ? "Spectating" : "Single Player");
  ui.setupPanel.classList.add("hidden");
  render();
}

function resetToSetup() {
  if (actionTimeout) clearTimeout(actionTimeout);
  clearNotice();
  localState = null;
  onlineState = null;
  notice = null;
  autoPlay = false;
  showingReveal = false;
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
        gameType: "hand-cricket",
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
      showingReveal = false;
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

// Hand cricket is always 2 players, so stepper is hidden but keep stubs
if (ui.playerMinus) {
  ui.playerMinus.addEventListener("click", () => {});
}
if (ui.playerPlus) {
  ui.playerPlus.addEventListener("click", () => {});
}

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

// Toss call buttons
ui.tossOddBtn.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "toss_choose") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;
  dispatchAction({ type: "toss_call", playerId: viewingId, call: "odd" });
});

ui.tossEvenBtn.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "toss_choose") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;
  dispatchAction({ type: "toss_call", playerId: viewingId, call: "even" });
});

// Bat or Bowl
ui.chooseBat.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "bat_or_bowl") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;
  dispatchAction({ type: "choose_role", playerId: viewingId, role: "bat" });
});

ui.chooseBowl.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "bat_or_bowl") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;
  dispatchAction({ type: "choose_role", playerId: viewingId, role: "bowl" });
});

// Number buttons (1-6)
const numBtns = ui.numberButtons.querySelectorAll(".num-btn");
for (const btn of numBtns) {
  btn.addEventListener("click", () => {
    const state = currentState();
    if (!state) return;
    const viewingId = currentViewingPlayerId(state);
    if (!viewingId) return;
    const num = Number(btn.dataset.num);

    if (state.phase === "toss_flip") {
      dispatchAction({ type: "toss_number", playerId: viewingId, number: num });
    } else if (state.phase === "batting" || state.phase === "chasing") {
      dispatchAction({ type: "choose_number", playerId: viewingId, number: num });
    }
  });
}

// Continue button (dismiss reveal)
ui.continueBtn.addEventListener("click", () => {
  showingReveal = false;
  if (actionTimeout) clearTimeout(actionTimeout);
  render();
});

ui.autoPlayToggle.addEventListener("click", () => {
  autoPlay = !autoPlay;
  ui.autoPlayToggle.textContent = autoPlay ? "Auto Play: On" : "Auto Play: Off";
  if (autoPlay) {
    render(); // triggers bot scheduling
  }
});

ui.restartLocal.addEventListener("click", resetToSetup);
ui.winnerNewGame.addEventListener("click", resetToSetup);

// Sidebar
ui.toggleLogs.addEventListener("click", () => {
  ui.sidebar.classList.toggle("open");
  document.querySelector(".cricket-app").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".cricket-app").classList.remove("sidebar-open");
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
