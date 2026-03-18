import {
  applyAction,
  createGame,
  getBotMove,
  CATEGORIES,
  CATEGORY_LABELS,
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
  roundsMinus: document.getElementById("roundsMinus"),
  roundsPlus: document.getElementById("roundsPlus"),
  roundsCount: document.getElementById("roundsCount"),
  timeMinus: document.getElementById("timeMinus"),
  timePlus: document.getElementById("timePlus"),
  timeCount: document.getElementById("timeCount"),
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
  letterDisplay: document.getElementById("letterDisplay"),
  letterBig: document.getElementById("letterBig"),
  timerBar: document.getElementById("timerBar"),
  timerFill: document.getElementById("timerFill"),
  timerText: document.getElementById("timerText"),
  scoreboard: document.getElementById("scoreboard"),
  scoreboardBody: document.getElementById("scoreboardBody"),
  answerForm: document.getElementById("answerForm"),
  formLetter: document.getElementById("formLetter"),
  answerName: document.getElementById("answerName"),
  answerPlace: document.getElementById("answerPlace"),
  answerAnimal: document.getElementById("answerAnimal"),
  answerThing: document.getElementById("answerThing"),
  submitAnswers: document.getElementById("submitAnswers"),
  submittedMsg: document.getElementById("submittedMsg"),
  roundResults: document.getElementById("roundResults"),
  resultsTitle: document.getElementById("resultsTitle"),
  resultsTable: document.getElementById("resultsTable"),
  nextRoundBtn: document.getElementById("nextRoundBtn"),
  sidebar: document.getElementById("sidebar"),
  sidebarLogs: document.getElementById("sidebarLogs"),
  toggleLogs: document.getElementById("toggleLogs"),
  closeSidebar: document.getElementById("closeSidebar"),
  toast: document.getElementById("toast"),
  winnerBanner: document.getElementById("winnerBanner"),
  winnerName: document.getElementById("winnerName"),
  winnerScore: document.getElementById("winnerScore"),
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
let timerRemaining = 0;
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
// Timer
// ================================================
function startTimer(seconds) {
  stopTimer();
  timerRemaining = seconds;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timerRemaining -= 1;
    updateTimerDisplay();

    if (timerRemaining <= 0) {
      stopTimer();
      // Auto-submit if player hasn't submitted
      const state = currentState();
      if (state && state.phase === "playing") {
        const viewingId = currentViewingPlayerId(state);
        const me = state.players.find((p) => p.id === viewingId);
        if (me && !me.submitted) {
          autoSubmitAnswers();
        }
        // Also submit for any bots that haven't submitted
        submitBotAnswers();
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const state = currentState();
  const total = state ? state.timeLimit : 30;
  const pct = Math.max(0, (timerRemaining / total) * 100);

  ui.timerFill.style.width = `${pct}%`;
  ui.timerText.textContent = `${Math.max(0, timerRemaining)}s`;

  if (timerRemaining <= 5) {
    ui.timerFill.classList.add("urgent");
    ui.timerText.classList.add("urgent");
  } else {
    ui.timerFill.classList.remove("urgent");
    ui.timerText.classList.remove("urgent");
  }
}

function autoSubmitAnswers() {
  const state = currentState();
  if (!state || state.phase !== "playing") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;
  const me = state.players.find((p) => p.id === viewingId);
  if (!me || me.submitted) return;

  const answers = {
    name: ui.answerName.value.trim(),
    place: ui.answerPlace.value.trim(),
    animal: ui.answerAnimal.value.trim(),
    thing: ui.answerThing.value.trim(),
  };

  dispatchAction({ type: "submit_answers", playerId: viewingId, answers });
}

function submitBotAnswers() {
  const state = currentState();
  if (!state || state.phase !== "playing") return;

  for (let i = 0; i < state.players.length; i += 1) {
    const p = state.players[i];
    if (p.isBot && !p.submitted) {
      const botAction = getBotMove(state, i);
      if (botAction) dispatchAction(botAction);
    }
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
  const me = state.players.find((p) => p.id === viewingPlayerId);

  // Turn info
  ui.turnName.textContent = `Round ${state.currentRound} / ${state.totalRounds}`;
  ui.turnCard.classList.toggle("active", state.phase === "playing");

  if (state.phase === "waiting") {
    ui.turnHint.textContent = "Press Start Round to begin!";
  } else if (state.phase === "playing") {
    const submitted = state.players.filter((p) => p.submitted).length;
    ui.turnHint.textContent = `${submitted}/${state.players.length} players submitted`;
  } else if (state.phase === "scoring") {
    ui.turnHint.textContent = "Review the results, then continue.";
  } else if (state.phase === "finished") {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.turnHint.textContent = winner ? `${winner.name} wins the game!` : "Game over.";
  }

  // Letter display
  ui.letterBig.textContent = state.currentLetter || "?";
  ui.formLetter.textContent = state.currentLetter || "?";

  if (state.phase === "playing") {
    ui.letterDisplay.classList.remove("hidden");
    ui.timerBar.classList.remove("hidden");
  } else if (state.phase === "waiting") {
    ui.letterDisplay.classList.remove("hidden");
    ui.timerBar.classList.add("hidden");
    ui.timerText.textContent = `${state.timeLimit}s`;
    ui.timerFill.style.width = "100%";
    ui.timerFill.classList.remove("urgent");
    ui.timerText.classList.remove("urgent");
  } else {
    ui.letterDisplay.classList.remove("hidden");
    ui.timerBar.classList.add("hidden");
  }

  // Winner banner
  if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    ui.winnerBanner.classList.remove("hidden");
    ui.winnerName.textContent = `${winner?.name || "Someone"} Wins!`;
    ui.winnerScore.textContent = `Final Score: ${winner?.score || 0} points`;
  } else {
    ui.winnerBanner.classList.add("hidden");
  }

  // Scoreboard
  renderScoreboard(state, viewingPlayerId);

  // Answer form
  if (state.phase === "playing" && me && !me.isBot) {
    ui.answerForm.classList.remove("hidden");
    ui.roundResults.classList.add("hidden");

    if (me.submitted) {
      ui.submitAnswers.classList.add("hidden");
      ui.submittedMsg.classList.remove("hidden");
      disableAnswerInputs(true);
    } else {
      ui.submitAnswers.classList.remove("hidden");
      ui.submittedMsg.classList.add("hidden");
      disableAnswerInputs(false);
    }
  } else if (state.phase === "playing") {
    // Spectator during playing
    ui.answerForm.classList.add("hidden");
    ui.roundResults.classList.add("hidden");
  } else {
    ui.answerForm.classList.add("hidden");
  }

  // Round results
  if (state.phase === "scoring" || state.phase === "finished") {
    renderRoundResults(state, viewingPlayerId);
    ui.roundResults.classList.remove("hidden");
    ui.nextRoundBtn.classList.toggle("hidden", state.phase === "finished");
  } else if (state.phase !== "playing") {
    ui.roundResults.classList.add("hidden");
  }

  // Logs sidebar
  ui.sidebarLogs.innerHTML = "";
  (state.log || []).forEach((entry) => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.textContent = entry;
    ui.sidebarLogs.appendChild(div);
  });

  // Bot automation for start_round
  if (mode === "local" && (state.phase === "waiting" || state.phase === "scoring")) {
    const allBots = state.players.every((p) => p.isBot);
    if (allBots) {
      if (botTimeout) clearTimeout(botTimeout);
      botTimeout = setTimeout(() => {
        if (!localState) return;
        const botAction = getBotMove(localState, 0);
        if (botAction) dispatchAction(botAction);
      }, 1500);
    }
  }
}

function renderScoreboard(state, viewingPlayerId) {
  ui.scoreboardBody.innerHTML = "";

  // Sort players by score descending
  const sorted = [...state.players].sort((a, b) => b.score - a.score);

  sorted.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "scoreboard-row";
    if (player.id === viewingPlayerId) row.classList.add("you");

    const rank = document.createElement("div");
    rank.className = "sb-rank";
    if (index === 0) rank.classList.add("gold");
    else if (index === 1) rank.classList.add("silver");
    else if (index === 2) rank.classList.add("bronze");
    else rank.classList.add("other");
    rank.textContent = String(index + 1);

    const name = document.createElement("div");
    name.className = "sb-name";
    name.textContent = player.name + (player.isBot ? " (Bot)" : "");

    const scoreEl = document.createElement("div");
    scoreEl.className = "sb-score";
    scoreEl.textContent = String(player.score);

    row.appendChild(rank);
    row.appendChild(name);

    // Show submitted status during playing phase
    if (state.phase === "playing") {
      const submitted = document.createElement("div");
      submitted.className = "sb-submitted " + (player.submitted ? "yes" : "no");
      submitted.textContent = player.submitted ? "Done" : "Writing...";
      row.appendChild(submitted);
    }

    row.appendChild(scoreEl);
    ui.scoreboardBody.appendChild(row);
  });
}

function renderRoundResults(state, viewingPlayerId) {
  const lastRound = state.roundScores[state.roundScores.length - 1];
  if (!lastRound) return;

  ui.resultsTitle.textContent = `Round ${state.currentRound} Results - Letter "${lastRound.letter}"`;

  ui.resultsTable.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "results-grid";

  // Header row
  const headers = ["Player", "Name", "Place", "Animal", "Thing", "Total"];
  headers.forEach((h) => {
    const cell = document.createElement("div");
    cell.className = "results-cell header";
    cell.textContent = h;
    grid.appendChild(cell);
  });

  // Player rows
  for (const entry of lastRound.scores) {
    // Player name
    const nameCell = document.createElement("div");
    nameCell.className = "results-cell player-name";
    if (entry.playerId === viewingPlayerId) nameCell.classList.add("you-cell");
    nameCell.textContent = entry.playerName;
    grid.appendChild(nameCell);

    // Category answers
    for (const cat of CATEGORIES) {
      const cell = document.createElement("div");
      cell.className = "results-cell";

      const answerText = document.createElement("div");
      const answer = entry.answers[cat] || "";
      const points = entry.points[cat] || 0;

      answerText.className = "answer-text";
      if (!answer) {
        answerText.classList.add("empty");
        answerText.textContent = "--";
      } else if (points === 0) {
        answerText.classList.add("invalid");
        answerText.textContent = answer;
      } else {
        answerText.textContent = answer;
      }

      const pointsEl = document.createElement("div");
      pointsEl.className = `answer-points pts-${points}`;
      pointsEl.textContent = `+${points}`;

      cell.appendChild(answerText);
      cell.appendChild(pointsEl);
      grid.appendChild(cell);
    }

    // Total
    const totalCell = document.createElement("div");
    totalCell.className = "results-cell total";
    totalCell.textContent = `+${entry.totalRoundPoints}`;
    grid.appendChild(totalCell);
  }

  ui.resultsTable.appendChild(grid);
}

function disableAnswerInputs(disabled) {
  ui.answerName.disabled = disabled;
  ui.answerPlace.disabled = disabled;
  ui.answerAnimal.disabled = disabled;
  ui.answerThing.disabled = disabled;
}

function clearAnswerInputs() {
  ui.answerName.value = "";
  ui.answerPlace.value = "";
  ui.answerAnimal.value = "";
  ui.answerThing.value = "";
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

  const prevPhase = localState.phase;
  const result = applyAction(localState, action);
  if (result.error) {
    showNotice(result.error);
    return;
  }
  localState = result.state;

  // Start timer when entering playing phase
  if (prevPhase !== "playing" && localState.phase === "playing") {
    clearAnswerInputs();
    startTimer(localState.timeLimit);
  }

  // Stop timer when leaving playing phase
  if (prevPhase === "playing" && localState.phase !== "playing") {
    stopTimer();
  }

  render();
}

// ================================================
// Game Setup
// ================================================
function startLocalGame() {
  const name = document.getElementById("localName").value.trim() || "Player";
  const botCount = Number(ui.playerCount.textContent);
  const totalRounds = Number(ui.roundsCount.textContent);
  const timeLimit = Number(ui.timeCount.textContent);
  const isSpectator = ui.localSpectator.checked;

  const botNames = [
    "Alice", "Bob", "Charlie", "Diana",
    "Edward", "Fiona", "George", "Hannah",
  ];

  const players = [];
  if (!isSpectator) {
    players.push({ id: "p1", name, isBot: false });
  }

  for (let i = 0; i < botCount; i += 1) {
    const botName = botNames[i % botNames.length];
    players.push({ id: `bot${i + 1}`, name: `${botName}`, isBot: true });
  }

  // Must have at least 2 players
  if (players.length < 2) {
    const extra = botNames[players.length % botNames.length];
    players.push({ id: "bot_extra", name: `${extra}`, isBot: true });
  }

  notice = null;
  localState = createGame({ players, options: { totalRounds, timeLimit } });
  myPlayerId = isSpectator ? null : "p1";
  setStatus(isSpectator ? "Spectating" : "Single Player");
  ui.setupPanel.classList.add("hidden");
  render();
}

function resetToSetup() {
  stopTimer();
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
        gameType: "name-place-animal-thing",
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

ui.roundsMinus.addEventListener("click", () => {
  const count = Math.max(1, Number(ui.roundsCount.textContent) - 1);
  ui.roundsCount.textContent = String(count);
});

ui.roundsPlus.addEventListener("click", () => {
  const count = Math.min(10, Number(ui.roundsCount.textContent) + 1);
  ui.roundsCount.textContent = String(count);
});

ui.timeMinus.addEventListener("click", () => {
  const count = Math.max(10, Number(ui.timeCount.textContent) - 5);
  ui.timeCount.textContent = String(count);
});

ui.timePlus.addEventListener("click", () => {
  const count = Math.min(60, Number(ui.timeCount.textContent) + 5);
  ui.timeCount.textContent = String(count);
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

// Submit answers
ui.submitAnswers.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase !== "playing") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;

  const answers = {
    name: ui.answerName.value.trim(),
    place: ui.answerPlace.value.trim(),
    animal: ui.answerAnimal.value.trim(),
    thing: ui.answerThing.value.trim(),
  };

  dispatchAction({ type: "submit_answers", playerId: viewingId, answers });
});

// Next round button — start_round action
ui.nextRoundBtn.addEventListener("click", () => {
  const state = currentState();
  if (!state || (state.phase !== "scoring" && state.phase !== "waiting")) return;
  const viewingId = currentViewingPlayerId(state);
  // Any player can start the next round
  const pid = viewingId || (state.players[0] ? state.players[0].id : null);
  if (!pid) return;
  dispatchAction({ type: "start_round", playerId: pid });
});

// Also handle clicking the letter display area to start a round (when waiting)
ui.letterDisplay.addEventListener("click", () => {
  const state = currentState();
  if (!state) return;
  if (state.phase === "waiting" || state.phase === "scoring") {
    const viewingId = currentViewingPlayerId(state);
    const pid = viewingId || (state.players[0] ? state.players[0].id : null);
    if (!pid) return;
    dispatchAction({ type: "start_round", playerId: pid });
  }
});

ui.restartLocal.addEventListener("click", resetToSetup);
ui.winnerNewGame.addEventListener("click", resetToSetup);

// Sidebar
ui.toggleLogs.addEventListener("click", () => {
  ui.sidebar.classList.toggle("open");
  document.querySelector(".npat-app").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".npat-app").classList.remove("sidebar-open");
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
