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
  scoreboard: document.getElementById("scoreboard"),
  inningsLabel: document.getElementById("inningsLabel"),
  scoreRow: document.getElementById("scoreRow"),
  targetBanner: document.getElementById("targetBanner"),
  targetValue: document.getElementById("targetValue"),
  targetNeed: document.getElementById("targetNeed"),
  turnCard: document.getElementById("turnCard"),
  turnName: document.getElementById("turnName"),
  turnHint: document.getElementById("turnHint"),
  autoPlayToggle: document.getElementById("autoPlayToggle"),
  restartLocal: document.getElementById("restartLocal"),
  bookArea: document.getElementById("bookArea"),
  book: document.getElementById("book"),
  bookCoverFront: document.getElementById("bookCoverFront"),
  bookPageLeft: document.getElementById("bookPageLeft"),
  bookPageRight: document.getElementById("bookPageRight"),
  pageNumber: document.getElementById("pageNumber"),
  pageRuns: document.getElementById("pageRuns"),
  openBookBtn: document.getElementById("openBookBtn"),
  ballHistory: document.getElementById("ballHistory"),
  ballTrack: document.getElementById("ballTrack"),
  sidebar: document.getElementById("sidebar"),
  sidebarLogs: document.getElementById("sidebarLogs"),
  toggleLogs: document.getElementById("toggleLogs"),
  closeSidebar: document.getElementById("closeSidebar"),
  toast: document.getElementById("toast"),
  winnerBanner: document.getElementById("winnerBanner"),
  winnerName: document.getElementById("winnerName"),
  winnerSummary: document.getElementById("winnerSummary"),
  winnerTrophy: document.getElementById("winnerTrophy"),
  winnerNewGame: document.getElementById("winnerNewGame"),
  outOverlay: document.getElementById("outOverlay"),
  outSub: document.getElementById("outSub"),
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
let bookAnimating = false;

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
// Book Animation
// ================================================
function animateBookOpen(page, runs, isOut, callback) {
  bookAnimating = true;

  // Reset to closed
  ui.book.classList.remove("opening");
  ui.book.classList.add("closed");

  // Set page content before opening
  ui.pageNumber.textContent = String(page);

  if (isOut) {
    ui.pageRuns.textContent = "OUT!";
    ui.pageRuns.className = "page-runs out";
  } else if (runs === 6) {
    ui.pageRuns.textContent = "SIX!";
    ui.pageRuns.className = "page-runs boundary";
  } else if (runs === 4) {
    ui.pageRuns.textContent = "FOUR!";
    ui.pageRuns.className = "page-runs boundary";
  } else {
    ui.pageRuns.textContent = `${runs} run${runs !== 1 ? "s" : ""}`;
    ui.pageRuns.className = "page-runs";
  }

  // Short delay then open
  setTimeout(() => {
    ui.book.classList.remove("closed");
    ui.book.classList.add("opening");

    // After animation completes
    setTimeout(() => {
      if (isOut) {
        showOutOverlay(page);
      }
      bookAnimating = false;
      if (callback) callback();
    }, 1200);
  }, 200);
}

function closeBook() {
  ui.book.classList.remove("opening");
  ui.book.classList.add("closed");
}

function showOutOverlay(page) {
  const lastDigit = page % 10;
  ui.outSub.textContent = `Page ${page} - Last digit ${lastDigit}`;
  ui.outOverlay.classList.remove("hidden");
  setTimeout(() => {
    ui.outOverlay.classList.add("hidden");
  }, 2000);
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
  const currentBatter = state.players[state.currentBatterIndex];
  const isMyTurn = currentBatter && currentBatter.id === viewingPlayerId;

  // Innings label
  if (state.phase === "batting") {
    ui.inningsLabel.textContent = "1st Innings";
  } else if (state.phase === "chasing") {
    ui.inningsLabel.textContent = "2nd Innings";
  } else {
    ui.inningsLabel.textContent = "Match Over";
  }

  // Scoreboard
  ui.scoreRow.innerHTML = "";
  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    const card = document.createElement("div");
    card.className = "score-card";
    if (state.currentBatterIndex === i && state.phase !== "finished") {
      card.classList.add("active");
    }

    const nameEl = document.createElement("div");
    nameEl.className = "player-name";
    nameEl.textContent = p.name;

    const scoreEl = document.createElement("div");
    scoreEl.className = "player-score";
    scoreEl.textContent = String(p.score);

    const statusEl = document.createElement("div");
    statusEl.className = "player-status";
    if (p.isOut) {
      statusEl.textContent = "OUT";
      statusEl.classList.add("out");
    } else if (state.currentBatterIndex === i && state.phase !== "finished") {
      statusEl.textContent = "Batting";
      statusEl.classList.add("batting");
    } else if (state.phase === "batting" && i === 1) {
      statusEl.textContent = "Yet to bat";
      statusEl.classList.add("waiting");
    } else if (state.phase === "finished") {
      statusEl.textContent = p.isOut ? "OUT" : `${p.score} runs`;
      statusEl.classList.add(p.isOut ? "out" : "batting");
    }

    const ballsEl = document.createElement("div");
    ballsEl.className = "balls-count";
    ballsEl.textContent = `${p.balls.length} ball${p.balls.length !== 1 ? "s" : ""}`;

    card.appendChild(nameEl);
    card.appendChild(scoreEl);
    card.appendChild(statusEl);
    card.appendChild(ballsEl);
    ui.scoreRow.appendChild(card);
  }

  // Target banner
  if (state.phase === "chasing" && state.target) {
    ui.targetBanner.classList.remove("hidden");
    ui.targetValue.textContent = String(state.target);
    const chaser = state.players[1];
    const need = state.target - chaser.score;
    ui.targetNeed.textContent = need > 0 ? `Need ${need} more` : "Target reached!";
  } else {
    ui.targetBanner.classList.add("hidden");
  }

  // Turn info
  ui.turnName.textContent = isMyTurn ? "Your Turn" : `${currentBatter?.name || "?"}'s Turn`;
  ui.turnCard.classList.toggle("my-turn", isMyTurn);

  if (state.phase === "finished") {
    if (state.winnerId) {
      const winner = state.players.find((p) => p.id === state.winnerId);
      ui.turnHint.textContent = winner ? `${winner.name} wins the match!` : "Match over.";
    } else {
      ui.turnHint.textContent = "Match tied!";
    }
  } else if (isMyTurn) {
    ui.turnHint.textContent = "Open the book to score runs!";
  } else {
    ui.turnHint.textContent = `Waiting for ${currentBatter?.name} to open the book...`;
  }

  // Open Book button
  const canOpen = !bookAnimating && state.phase !== "finished" && isMyTurn && !currentBatter.isOut;
  ui.openBookBtn.disabled = !canOpen;

  // Ball-by-ball history for current batter
  const batter = state.players[state.currentBatterIndex];
  ui.ballTrack.innerHTML = "";

  const balls = batter.balls;
  // Show last 18 balls (3 overs)
  const recentBalls = balls.slice(-18);
  recentBalls.forEach((ball, idx) => {
    // Add over separator every 6 balls
    const ballIdx = balls.length - recentBalls.length + idx;
    if (ballIdx > 0 && ballIdx % 6 === 0) {
      const sep = document.createElement("div");
      sep.className = "ball-separator";
      ui.ballTrack.appendChild(sep);
    }

    const dot = document.createElement("div");
    dot.className = "ball-dot";

    if (ball.isOut) {
      dot.classList.add("out");
      dot.textContent = "OUT";
    } else if (ball.runs === 6) {
      dot.classList.add("six");
      dot.textContent = "6";
    } else if (ball.runs === 4) {
      dot.classList.add("boundary");
      dot.textContent = "4";
    } else {
      dot.textContent = String(ball.runs);
      if (ball.runs === 0) dot.classList.add("dot-ball");
    }

    // Tooltip with page number
    dot.title = `Page ${ball.page}`;
    ui.ballTrack.appendChild(dot);
  });

  // Winner banner
  if (state.phase === "finished") {
    if (state.winnerId) {
      const winner = state.players.find((p) => p.id === state.winnerId);
      const loser = state.players.find((p) => p.id !== state.winnerId);
      ui.winnerBanner.classList.remove("hidden");
      ui.winnerName.textContent = `${winner?.name || "Someone"} Wins!`;
      ui.winnerSummary.textContent = `${winner?.name}: ${winner?.score} | ${loser?.name}: ${loser?.score}`;
    } else {
      // Tie
      ui.winnerBanner.classList.remove("hidden");
      ui.winnerTrophy.textContent = "🤝";
      ui.winnerName.textContent = "It's a Tie!";
      ui.winnerSummary.textContent = `Both scored ${state.players[0].score} runs`;
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
  if (mode === "local" && state.phase !== "finished" && !bookAnimating) {
    const cp = state.players[state.currentBatterIndex];
    if (cp && cp.isBot && !cp.isOut) {
      if (actionTimeout) clearTimeout(actionTimeout);
      actionTimeout = setTimeout(() => {
        if (!localState || localState.phase === "finished") return;
        const botAction = getBotMove(localState, localState.currentBatterIndex);
        if (botAction) handleOpenBook(botAction);
      }, 1200);
    } else if (cp && cp.id === viewingPlayerId && autoPlay && !cp.isOut) {
      if (actionTimeout) clearTimeout(actionTimeout);
      actionTimeout = setTimeout(() => {
        if (!localState || localState.phase === "finished") return;
        const idx = localState.players.findIndex((p) => p.id === viewingPlayerId);
        if (idx >= 0 && !localState.players[idx].isOut) {
          const botAction = getBotMove(localState, idx);
          if (botAction) handleOpenBook(botAction);
        }
      }, 800);
    }
  }
}

// ================================================
// Action Dispatch with Animation
// ================================================
function handleOpenBook(action) {
  if (bookAnimating) return;

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

  const result = applyAction(localState, action);
  if (result.error) {
    showNotice(result.error);
    return;
  }

  localState = result.state;
  const ball = result.ball;

  if (ball) {
    // Animate the book opening
    animateBookOpen(ball.page, ball.runs, ball.isOut, () => {
      // After animation, close the book and re-render
      setTimeout(() => {
        closeBook();
        render();
      }, ball.isOut ? 2200 : 1200);
    });
    // Render immediately to update scoreboard etc
    render();
  } else {
    render();
  }
}

function dispatchAction(action) {
  handleOpenBook(action);
}

// ================================================
// Game Setup
// ================================================
function startLocalGame() {
  const name = document.getElementById("localName").value.trim() || "Player";
  const botCount = Number(ui.playerCount.textContent);
  const isSpectator = ui.localSpectator.checked;

  const botNames = [
    "Sachin", "Virat", "Dhoni", "Rohit",
    "Bumrah", "Jadeja", "Rahul", "Hardik",
  ];

  // Book cricket is always 2 players
  const players = [];
  if (!isSpectator) {
    players.push({ id: "p1", name, isBot: false });
  }

  // Add bot(s) — book cricket only uses 2 players total
  const botsNeeded = isSpectator ? 2 : 1;
  for (let i = 0; i < botsNeeded; i += 1) {
    const botName = botNames[i % botNames.length];
    players.push({ id: `bot${i + 1}`, name: `${botName} (Bot)`, isBot: true });
  }

  notice = null;
  localState = createGame({ players });
  myPlayerId = isSpectator ? null : "p1";
  setStatus(isSpectator ? "Spectating" : "Single Player");
  ui.setupPanel.classList.add("hidden");

  // Start with book closed
  closeBook();
  render();
}

function resetToSetup() {
  if (actionTimeout) clearTimeout(actionTimeout);
  clearNotice();
  localState = null;
  onlineState = null;
  notice = null;
  autoPlay = false;
  bookAnimating = false;
  ui.autoPlayToggle.textContent = "Auto Play: Off";
  ui.setupPanel.classList.remove("hidden");
  ui.gamePanel.classList.add("hidden");
  ui.winnerBanner.classList.add("hidden");
  ui.outOverlay.classList.add("hidden");
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
        gameType: "book-cricket",
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

// Open Book button
ui.openBookBtn.addEventListener("click", () => {
  const state = currentState();
  if (!state || state.phase === "finished") return;
  const viewingId = currentViewingPlayerId(state);
  if (!viewingId) return;
  handleOpenBook({ type: "open_page", playerId: viewingId });
});

ui.autoPlayToggle.addEventListener("click", () => {
  autoPlay = !autoPlay;
  ui.autoPlayToggle.textContent = autoPlay ? "Auto Play: On" : "Auto Play: Off";
  if (autoPlay && mode === "local" && localState && localState.phase !== "finished") {
    const cp = localState.players[localState.currentBatterIndex];
    const viewingId = currentViewingPlayerId(localState);
    if (cp && cp.id === viewingId && !cp.isOut) {
      if (actionTimeout) clearTimeout(actionTimeout);
      actionTimeout = setTimeout(() => {
        if (!localState || localState.phase === "finished") return;
        const idx = localState.players.findIndex((p) => p.id === viewingId);
        if (idx >= 0) {
          const botAction = getBotMove(localState, idx);
          if (botAction) handleOpenBook(botAction);
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
  document.querySelector(".bc-app").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".bc-app").classList.remove("sidebar-open");
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
