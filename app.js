import {
  applyAction,
  createGame,
  getCurrentColor,
  getPlayableCards,
  getTopCard,
  getBotMove,
} from "./game.js";

const ui = {
  connectionStatus: document.getElementById("connectionStatus"),
  setupPanel: document.getElementById("setupPanel"),
  localSetup: document.getElementById("localSetup"),
  onlineSetup: document.getElementById("onlineSetup"),
  modeButtons: document.querySelectorAll(".mode-btn"),
  playerMinus: document.getElementById("playerMinus"),
  playerPlus: document.getElementById("playerPlus"),
  playerCount: document.getElementById("playerCount"),
  ruleUnoPenalty: document.getElementById("ruleUnoPenalty"),
  ruleStrictWild: document.getElementById("ruleStrictWild"),
  ruleMustDraw: document.getElementById("ruleMustDraw"),
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
  onlineRuleUnoPenalty: document.getElementById("onlineRuleUnoPenalty"),
  onlineRuleStrictWild: document.getElementById("onlineRuleStrictWild"),
  onlineRuleMustDraw: document.getElementById("onlineRuleMustDraw"),
  onlineSpectator: document.getElementById("onlineSpectator"),
  gamePanel: document.getElementById("gamePanel"),
  turnName: document.getElementById("turnName"),
  turnHint: document.getElementById("turnHint"),
  drawBtn: document.getElementById("drawBtn"),
  passBtn: document.getElementById("passBtn"),
  unoBtn: document.getElementById("unoBtn"),
  callUnoBtn: document.getElementById("callUnoBtn"),
  restartLocal: document.getElementById("restartLocal"),
  drawCount: document.getElementById("drawCount"),
  drawPile: document.getElementById("drawPile"),
  discardPile: document.getElementById("discardPile"),
  colorIndicator: document.getElementById("colorIndicator"),
  playersRow: document.getElementById("playersRow"),
  hand: document.getElementById("hand"),
  handTitle: document.getElementById("handTitle"),
  handMeta: document.getElementById("handMeta"),
  sidebar: document.getElementById("sidebar"),
  sidebarLogs: document.getElementById("sidebarLogs"),
  toggleLogs: document.getElementById("toggleLogs"),
  closeSidebar: document.getElementById("closeSidebar"),
  timerBar: document.getElementById("timerBar"),
  lastActionText: document.getElementById("lastActionText"),
  passOverlay: document.getElementById("passOverlay"),
  passTitle: document.getElementById("passTitle"),
  passSubtitle: document.getElementById("passSubtitle"),
  passReady: document.getElementById("passReady"),
  colorOverlay: document.getElementById("colorOverlay"),
  colorChoices: document.querySelectorAll(".color-choice"),
  autoPlayToggle: document.getElementById("autoPlayToggle"),
};

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
let localTurnTimer = null;
const LOCAL_TURN_MS = 15000;

function showNotice(message) {
  notice = message;
  if (noticeTimeout) {
    clearTimeout(noticeTimeout);
  }
  noticeTimeout = setTimeout(() => {
    notice = null;
    render();
  }, 2000);
  render();
}

function clearLocalTurnTimer() {
  if (localTurnTimer) {
    clearTimeout(localTurnTimer);
    localTurnTimer = null;
  }
}

function autoMoveForHuman() {
  if (mode !== "local" || !localState || localState.phase !== "playing") return;
  const viewingId = currentViewingPlayerId(localState);
  const currentPlayer = localState.players[localState.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== viewingId) return;
  const meIndex = localState.players.findIndex(p => p.id === viewingId);
  if (meIndex < 0) return;
  const botAction = getBotMove(localState, meIndex);
  if (botAction) dispatchAction(botAction);
}

function startLocalTurnTimer() {
  clearLocalTurnTimer();
  if (mode !== "local" || !localState || localState.phase !== "playing") return;
  const currentPlayer = localState.players[localState.currentPlayerIndex];
  const viewingId = currentViewingPlayerId(localState);
  if (!currentPlayer || currentPlayer.isBot || currentPlayer.id !== viewingId) return;
  localState.turnEndTime = Date.now() + LOCAL_TURN_MS;
  localTurnTimer = setTimeout(() => {
    if (mode !== "local" || !localState || localState.phase !== "playing") return;
    const cp = localState.players[localState.currentPlayerIndex];
    if (cp && cp.id === viewingId) {
      showNotice("Time's up! Auto-playing...");
      autoMoveForHuman();
    }
  }, LOCAL_TURN_MS);
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
  // If human exists, human is p1. If spectator mode, human has no ID.
  const human = state.players.find(p => !p.isBot);
  return human ? human.id : null;
}

function cardSymbol(card) {
  if (card.type === "number") return String(card.value);
  if (card.type === "skip") return "Skip";
  if (card.type === "reverse") return "REV";
  if (card.type === "draw2") return "+2";
  if (card.type === "wild") return "Wild";
  if (card.type === "wild4") return "+4";
  return card.label || "?";
}

function cardColorClass(card) {
  if (card.type === "wild" || card.type === "wild4") return "wild";
  return card.color || "wild";
}

function createCardElement(card, { playable = false, disabled = false } = {}) {
  const el = document.createElement("div");
  el.className = `card ${cardColorClass(card)}`;
  if (playable) el.classList.add("playable");
  if (disabled) el.classList.add("disabled");

  const inner = document.createElement("div");
  inner.className = "inner";

  const top = document.createElement("span");
  top.className = "corner";
  top.textContent = cardSymbol(card);

  const center = document.createElement("span");
  center.className = "center";
  center.textContent = cardSymbol(card);

  const bottom = document.createElement("span");
  bottom.className = "corner bottom";
  bottom.textContent = cardSymbol(card);

  inner.appendChild(top);
  inner.appendChild(center);
  inner.appendChild(bottom);
  el.appendChild(inner);

  el.title = card.label || cardSymbol(card);
  return el;
}

function createBackCard() {
  const el = document.createElement("div");
  el.className = "card back";
  const inner = document.createElement("div");
  inner.className = "inner";
  const logo = document.createElement("span");
  logo.className = "logo";
  logo.textContent = "UNO";
  inner.appendChild(logo);
  el.appendChild(inner);
  return el;
}

let lastTopCardId = null;

function updateTimer() {
  const state = currentState();
  if (state && state.phase === "playing" && state.turnEndTime) {
    const now = Date.now();
    const total = mode === "local" ? LOCAL_TURN_MS : 30000;
    const remaining = Math.max(0, state.turnEndTime - now);
    const percent = (remaining / total) * 100;
    ui.timerBar.style.width = `${percent}%`;
    ui.timerBar.style.background = percent < 20 ? "var(--red)" : "var(--accent)";
  } else {
    ui.timerBar.style.width = "0%";
  }
  requestAnimationFrame(updateTimer);
}
updateTimer();

function render() {
  const state = currentState();
  if (!state) {
    ui.gamePanel.classList.add("hidden");
    ui.passOverlay.classList.add("hidden");
    ui.colorOverlay.classList.add("hidden");
    return;
  }

  ui.gamePanel.classList.remove("hidden");

  const viewingPlayerId = currentViewingPlayerId(state);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === viewingPlayerId;
  const meIndex = state.players.findIndex(p => p.id === viewingPlayerId);
  const me = meIndex >= 0 ? state.players[meIndex] : null;
  const topCard = getTopCard(state);
  const currentColor = getCurrentColor(state);
  const playableCards = meIndex >= 0 ? getPlayableCards(state, meIndex) : [];

  if (state.log && state.log.length > 0) {
    ui.lastActionText.textContent = state.log[0];
  }

  ui.turnName.textContent = isMyTurn ? "Your Turn" : `${currentPlayer?.name}'s Turn`;
  document.querySelector(".turn-card").classList.toggle("my-turn", isMyTurn);

  if (notice) {
    ui.turnHint.textContent = notice;
  } else if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find(p => p.id === state.winnerId);
    ui.turnHint.textContent = winner ? `${winner.name} won!` : "Game over.";
  } else if (state.awaitingColor) {
    ui.turnHint.textContent = isMyTurn ? "Pick a color" : "Choosing a color...";
  } else if (isMyTurn) {
    if (state.drawRestriction && state.drawRestriction.playerId === viewingPlayerId) {
      ui.turnHint.textContent = "Play the drawn card or pass";
    } else if (playableCards.length > 0) {
      ui.turnHint.textContent = "Play a card or draw";
    } else {
      ui.turnHint.textContent = "No playable cards - draw one";
    }
  } else {
    ui.turnHint.textContent = "Waiting...";
  }

  ui.drawCount.textContent = String(state.drawPileCount ?? state.drawPile.length);

  ui.discardPile.querySelectorAll('.card').forEach(c => c.remove());
  if (topCard) {
    const cardEl = createCardElement(topCard);
    cardEl.classList.add("disabled");
    if (topCard.id !== lastTopCardId) {
      cardEl.classList.add("new-play");
      lastTopCardId = topCard.id;
    }
    ui.discardPile.appendChild(cardEl);
  }

  ui.colorIndicator.textContent = currentColor ? currentColor : "";
  ui.colorIndicator.style.background = currentColor ? `var(--${currentColor})` : "transparent";

  ui.playersRow.innerHTML = "";
  state.players.forEach((player) => {
    const card = document.createElement("div");
    card.className = "player-card";
    if (player.id === currentPlayer?.id) card.classList.add("active");
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = player.name;
    const count = document.createElement("div");
    count.className = "count";
    const cardCount = player.handCount ?? player.hand.length;
    count.textContent = `${cardCount} cards`;
    card.appendChild(name);
    card.appendChild(count);
    ui.playersRow.appendChild(card);
  });

  ui.hand.innerHTML = "";
  ui.handTitle.textContent = me ? `${me.name}'s hand` : (viewingPlayerId ? "Hand" : "Spectating");

  if (me) {
    const playableSet = new Set(playableCards.map(c => c.id));
    if (me.hand.length === 0) {
      const placeholder = document.createElement("div");
      placeholder.textContent = "No cards";
      placeholder.className = "muted";
      ui.hand.appendChild(placeholder);
    } else {
      me.hand.forEach((card, idx) => {
        const isPlayableNow = playableSet.has(card.id);
        const restricted = state.drawRestriction && state.drawRestriction.playerId === viewingPlayerId && state.drawRestriction.cardId !== card.id;
        const disabled = !isMyTurn || state.phase === "finished" || state.awaitingColor || restricted || !isPlayableNow;
        const cardEl = createCardElement(card, { playable: isMyTurn && isPlayableNow && !restricted, disabled });
        const centerOffset = idx - (me.hand.length - 1) / 2;
        const rotation = centerOffset * 2.5;
        const distFromCenter = Math.abs(centerOffset);
        const yOffset = distFromCenter * distFromCenter * 1.5;
        cardEl.style.transform = `rotate(${rotation}deg) translateY(${yOffset}px)`;
        if (!disabled) {
          cardEl.addEventListener("click", () => {
            dispatchAction({ type: "play_card", playerId: viewingPlayerId, cardId: card.id });
          });
        }
        ui.hand.appendChild(cardEl);
      });
    }
  } else if (!viewingPlayerId) {
    const placeholder = document.createElement("div");
    placeholder.textContent = "Spectating - AI vs AI";
    placeholder.className = "muted";
    ui.hand.appendChild(placeholder);
  }

  ui.handMeta.textContent = meIndex >= 0 ? `${me.hand.length} cards | Draw pile ${state.drawPileCount ?? state.drawPile.length}` : "";

  const canDraw = isMyTurn && state.phase !== "finished" && !state.awaitingColor && !state.drawRestriction && (!state.options.mustDrawOnlyIfNoPlay || playableCards.length === 0);
  const canPass = isMyTurn && state.phase !== "finished" && !state.awaitingColor && (state.drawRestriction || playableCards.length === 0);

  ui.drawPile.classList.toggle("disabled", !canDraw);
  ui.drawBtn.disabled = !canDraw;
  ui.passBtn.disabled = !canPass;

  ui.unoBtn.classList.toggle("hidden", !(state.unoPendingPlayerId && state.unoPendingPlayerId === viewingPlayerId));
  ui.callUnoBtn.classList.toggle("hidden", !(state.unoPendingPlayerId && state.unoPendingPlayerId !== viewingPlayerId));

  ui.sidebarLogs.innerHTML = "";
  (state.log || []).forEach((entry) => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.textContent = entry;
    ui.sidebarLogs.appendChild(div);
  });

  if (state.awaitingColor && viewingPlayerId === state.awaitingColorPlayerId) {
    ui.colorOverlay.classList.remove("hidden");
  } else {
    ui.colorOverlay.classList.add("hidden");
  }

  // Local Bot Automation + Auto-play + Turn timer
  if (mode === "local" && state.phase === "playing") {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer && currentPlayer.isBot) {
      clearLocalTurnTimer();
      setTimeout(() => {
        if (mode !== "local" || !localState) return;
        const botAction = getBotMove(localState, localState.currentPlayerIndex);
        if (botAction) dispatchAction(botAction);
      }, 1500);
    } else if (currentPlayer && currentPlayer.id === viewingPlayerId) {
      if (autoPlay) {
        clearLocalTurnTimer();
        setTimeout(() => {
          if (mode !== "local" || !localState || localState.phase !== "playing") return;
          autoMoveForHuman();
        }, 800);
      } else {
        startLocalTurnTimer();
      }
    }
  }
}

ui.toggleLogs.addEventListener("click", () => {
  ui.sidebar.classList.toggle("open");
  document.querySelector(".uno").classList.toggle("sidebar-open", ui.sidebar.classList.contains("open"));
});

ui.closeSidebar.addEventListener("click", () => {
  ui.sidebar.classList.remove("open");
  document.querySelector(".uno").classList.remove("sidebar-open");
});

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
  clearLocalTurnTimer();
  const result = applyAction(localState, action);
  if (result.error) {
    showNotice(result.error);
    return;
  }
  localState = result.state;
  render();
}

function startLocalGame() {
  const name = document.getElementById("localName").value.trim() || "Player";
  const botCount = Number(ui.playerCount.textContent);
  const isSpectator = ui.localSpectator.checked;
  const players = [];
  if (!isSpectator) players.push({ id: "p1", name, isBot: false });
  for (let i = 0; i < botCount; i += 1) {
    players.push({ id: `bot${i + 1}`, name: `Bot ${i + 1}`, isBot: true });
  }
  if (players.length < 2) players.push({ id: `bot_extra`, name: `Bot Extra`, isBot: true });
  const options = {
    unoPenalty: ui.ruleUnoPenalty.checked,
    enforceWildDrawFour: ui.ruleStrictWild.checked,
    mustDrawOnlyIfNoPlay: ui.ruleMustDraw.checked,
  };
  notice = null;
  localState = createGame({ players, options });
  myPlayerId = isSpectator ? null : "p1";
  setStatus(isSpectator ? "Spectating" : "Single Player");
  ui.setupPanel.classList.add("hidden");
  render();
}

function resetToSetup() {
  clearLocalTurnTimer();
  localState = null; onlineState = null; notice = null;
  autoPlay = false;
  ui.autoPlayToggle.checked = false;
  ui.setupPanel.classList.remove("hidden");
  ui.gamePanel.classList.add("hidden");
  ui.colorOverlay.classList.add("hidden");
}

function connectOnline({ create }) {
  const name = ui.onlineName.value.trim() || "Player";
  const url = ui.serverUrl.value.trim();
  const rawCode = ui.roomCode.value.trim();
  if (!create && !rawCode) {
    showNotice("Enter a room code to join.");
    return;
  }
  const code = (rawCode || generateRoomCode()).toUpperCase();
  roomCode = code; ui.roomCode.value = code;
  if (socket) socket.close();
  socket = new WebSocket(url);
  setStatus("Connecting...");
  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({
      type: "hello", name, room: code, create,
      options: {
        unoPenalty: ui.onlineRuleUnoPenalty.checked,
        enforceWildDrawFour: ui.onlineRuleStrictWild.checked,
        mustDrawOnlyIfNoPlay: ui.onlineRuleMustDraw.checked,
      },
    }));
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
      ui.hostHint.textContent = isHost ? "You are the host. Start when everyone is ready." : "Waiting for the host to start.";
    }
    if (message.type === "game_state") {
      onlineState = message.state;
      notice = null;
      ui.setupPanel.classList.add("hidden");
      render();
    }
    if (message.type === "error") showNotice(message.message);
  });
  socket.addEventListener("close", () => { setStatus("Offline"); isHost = false; });
}

function leaveRoom() {
  if (socket) { socket.send(JSON.stringify({ type: "leave" })); socket.close(); }
  socket = null; onlineState = null; ui.onlineLobby.classList.add("hidden"); setStatus("Offline");
}

ui.modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

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
    socket.send(JSON.stringify({
      type: "start_game",
      options: {
        unoPenalty: ui.onlineRuleUnoPenalty.checked,
        enforceWildDrawFour: ui.onlineRuleStrictWild.checked,
        mustDrawOnlyIfNoPlay: ui.onlineRuleMustDraw.checked,
        spectator: ui.onlineSpectator.checked,
      },
    }));
  }
});

ui.leaveRoom.addEventListener("click", leaveRoom);
ui.drawBtn.addEventListener("click", () => dispatchAction({ type: "draw_card", playerId: currentViewingPlayerId(currentState()) }));
ui.drawPile.addEventListener("click", () => dispatchAction({ type: "draw_card", playerId: currentViewingPlayerId(currentState()) }));
ui.passBtn.addEventListener("click", () => dispatchAction({ type: "pass_turn", playerId: currentViewingPlayerId(currentState()) }));
ui.unoBtn.addEventListener("click", () => dispatchAction({ type: "declare_uno", playerId: currentViewingPlayerId(currentState()) }));
ui.callUnoBtn.addEventListener("click", () => dispatchAction({ type: "call_uno", playerId: currentViewingPlayerId(currentState()) }));
ui.restartLocal.addEventListener("click", resetToSetup);

ui.colorChoices.forEach((button) => {
  button.addEventListener("click", () => {
    const color = button.dataset.color;
    const state = currentState();
    if (!state || !state.awaitingColor) return;
    dispatchAction({ type: "choose_color", playerId: currentViewingPlayerId(state), color });
  });
});

ui.autoPlayToggle.addEventListener("change", () => {
  autoPlay = ui.autoPlayToggle.checked;
  if (autoPlay && mode === "local" && localState && localState.phase === "playing") {
    clearLocalTurnTimer();
    const currentPlayer = localState.players[localState.currentPlayerIndex];
    const viewingId = currentViewingPlayerId(localState);
    if (currentPlayer && currentPlayer.id === viewingId) {
      setTimeout(() => autoMoveForHuman(), 400);
    }
  } else if (!autoPlay && mode === "local" && localState && localState.phase === "playing") {
    startLocalTurnTimer();
  }
});

// Auto-fill room from URL
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam) {
  ui.roomCode.value = roomParam.toUpperCase();
  setMode("online");
}

setMode("local");
