import {
  applyAction,
  createGame,
  getCurrentColor,
  getPlayableCards,
  getTopCard,
  isPlayable,
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
  playerInputs: document.getElementById("playerInputs"),
  ruleUnoPenalty: document.getElementById("ruleUnoPenalty"),
  ruleStrictWild: document.getElementById("ruleStrictWild"),
  ruleMustDraw: document.getElementById("ruleMustDraw"),
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
  startOnline: document.getElementById("startOnline"),
  leaveRoom: document.getElementById("leaveRoom"),
  hostHint: document.getElementById("hostHint"),
  onlineRuleUnoPenalty: document.getElementById("onlineRuleUnoPenalty"),
  onlineRuleStrictWild: document.getElementById("onlineRuleStrictWild"),
  onlineRuleMustDraw: document.getElementById("onlineRuleMustDraw"),
  gamePanel: document.getElementById("gamePanel"),
  turnName: document.getElementById("turnName"),
  turnHint: document.getElementById("turnHint"),
  drawBtn: document.getElementById("drawBtn"),
  passBtn: document.getElementById("passBtn"),
  unoBtn: document.getElementById("unoBtn"),
  callUnoBtn: document.getElementById("callUnoBtn"),
  restartLocal: document.getElementById("restartLocal"),
  drawPile: document.getElementById("drawPile"),
  drawCount: document.getElementById("drawCount"),
  discardPile: document.getElementById("discardPile"),
  colorIndicator: document.getElementById("colorIndicator"),
  playersRow: document.getElementById("playersRow"),
  hand: document.getElementById("hand"),
  handTitle: document.getElementById("handTitle"),
  handMeta: document.getElementById("handMeta"),
  log: document.getElementById("log"),
  passOverlay: document.getElementById("passOverlay"),
  passTitle: document.getElementById("passTitle"),
  passSubtitle: document.getElementById("passSubtitle"),
  passReady: document.getElementById("passReady"),
  colorOverlay: document.getElementById("colorOverlay"),
  colorChoices: document.querySelectorAll(".color-choice"),
};

let mode = "local";
let localState = null;
let onlineState = null;
let myPlayerId = null;
let socket = null;
let roomCode = null;
let isHost = false;
let passPending = false;
let notice = null;
let noticeTimeout = null;

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

function updatePlayerInputs(count) {
  const currentNames = Array.from(ui.playerInputs.querySelectorAll("input")).map(
    (input) => input.value.trim()
  );
  ui.playerInputs.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const label = document.createElement("label");
    label.className = "field";
    const span = document.createElement("span");
    span.textContent = `Player ${i + 1}`;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentNames[i] || `Player ${i + 1}`;
    label.appendChild(span);
    label.appendChild(input);
    ui.playerInputs.appendChild(label);
  }
}

function currentState() {
  return mode === "online" ? onlineState : localState;
}

function currentViewingPlayerId(state) {
  if (!state) {
    return null;
  }
  if (mode === "online") {
    return myPlayerId;
  }
  const current = state.players[state.currentPlayerIndex];
  return current ? current.id : null;
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
  if (card.type === "wild" || card.type === "wild4") {
    return "wild";
  }
  return card.color || "wild";
}

function createCardElement(card, { playable = false, disabled = false } = {}) {
  const el = document.createElement("div");
  el.className = `card ${cardColorClass(card)}`;
  if (playable) {
    el.classList.add("playable");
  }
  if (disabled) {
    el.classList.add("disabled");
  }
  const top = document.createElement("span");
  top.className = "corner";
  top.textContent = cardSymbol(card);
  const center = document.createElement("span");
  center.className = "center";
  center.textContent = cardSymbol(card);
  const bottom = document.createElement("span");
  bottom.className = "corner";
  bottom.textContent = cardSymbol(card);
  el.appendChild(top);
  el.appendChild(center);
  el.appendChild(bottom);
  el.title = card.label || cardSymbol(card);
  return el;
}

function createBackCard() {
  const el = document.createElement("div");
  el.className = "card back";
  const top = document.createElement("span");
  top.className = "corner";
  top.textContent = "UNO";
  const center = document.createElement("span");
  center.className = "center";
  center.textContent = "UNO";
  const bottom = document.createElement("span");
  bottom.className = "corner";
  bottom.textContent = "UNO";
  el.appendChild(top);
  el.appendChild(center);
  el.appendChild(bottom);
  return el;
}

function render() {
  const state = currentState();
  if (!state) {
    ui.gamePanel.classList.add("hidden");
    return;
  }

  ui.gamePanel.classList.remove("hidden");

  const viewingPlayerId = currentViewingPlayerId(state);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === viewingPlayerId;
  const meIndex = state.players.findIndex(
    (player) => player.id === viewingPlayerId
  );
  const me = meIndex >= 0 ? state.players[meIndex] : null;
  const topCard = getTopCard(state);
  const currentColor = getCurrentColor(state);

  ui.turnName.textContent = currentPlayer ? currentPlayer.name : "-";
  if (notice) {
    ui.turnHint.textContent = notice;
  } else if (state.phase === "finished" && state.winnerId) {
    const winner = state.players.find((player) => player.id === state.winnerId);
    ui.turnHint.textContent = winner ? `${winner.name} wins!` : "Game over.";
  } else if (state.awaitingColor) {
    ui.turnHint.textContent = "Waiting on color choice";
  } else if (isMyTurn) {
    ui.turnHint.textContent = "Your turn";
  } else {
    ui.turnHint.textContent = `Waiting for ${currentPlayer?.name ?? "player"}`;
  }

  ui.drawCount.textContent = String(
    state.drawPileCount ?? state.drawPile.length
  );

  ui.discardPile.innerHTML = "";
  if (topCard) {
    const cardEl = createCardElement(topCard);
    cardEl.classList.add("disabled");
    ui.discardPile.appendChild(cardEl);
  }

  ui.colorIndicator.textContent = currentColor ? currentColor : "wild";
  ui.colorIndicator.style.background =
    currentColor === "red"
      ? "var(--red)"
      : currentColor === "yellow"
        ? "var(--yellow)"
        : currentColor === "green"
          ? "var(--green)"
          : currentColor === "blue"
            ? "var(--blue)"
            : "var(--panel-strong)";

  ui.playersRow.innerHTML = "";
  state.players.forEach((player) => {
    const card = document.createElement("div");
    card.className = "player-card";
    if (player.id === currentPlayer?.id) {
      card.classList.add("active");
    }
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
  ui.handTitle.textContent = me ? `${me.name}'s hand` : "Hand";

  if (mode === "local" && passPending) {
    ui.passTitle.textContent = `Pass to ${currentPlayer?.name ?? "next player"}`;
    if (state.unoPendingPlayerId) {
      const pendingPlayer = state.players.find(
        (player) => player.id === state.unoPendingPlayerId
      );
      ui.passSubtitle.textContent = pendingPlayer
        ? `${pendingPlayer.name} must call UNO before passing.`
        : "Call UNO before passing.";
      ui.passReady.textContent = "Call UNO and show hand";
      ui.passReady.dataset.unoPlayer = state.unoPendingPlayerId;
    } else {
      ui.passSubtitle.textContent = "Tap when you're ready to see your hand.";
      ui.passReady.textContent = "Show my hand";
      ui.passReady.dataset.unoPlayer = "";
    }
    ui.passOverlay.classList.remove("hidden");
    const placeholder = createBackCard();
    placeholder.classList.add("disabled");
    ui.hand.appendChild(placeholder);
  } else {
    ui.passOverlay.classList.add("hidden");
    const playableCards =
      meIndex >= 0 ? getPlayableCards(state, meIndex) : [];
    const playableSet = new Set(playableCards.map((card) => card.id));

    if (!me || me.hand.length === 0) {
      const placeholder = document.createElement("div");
      placeholder.textContent = "No cards";
      placeholder.className = "muted";
      ui.hand.appendChild(placeholder);
    } else {
      me.hand.forEach((card) => {
        const isPlayableNow = playableSet.has(card.id);
        const restricted =
          state.drawRestriction &&
          state.drawRestriction.playerId === viewingPlayerId &&
          state.drawRestriction.cardId !== card.id;
        const disabled =
          !isMyTurn ||
          state.phase === "finished" ||
          state.awaitingColor ||
          restricted;
        const cardEl = createCardElement(card, {
          playable: isMyTurn && isPlayableNow && !restricted,
          disabled,
        });
        if (!disabled) {
          cardEl.addEventListener("click", () => {
            dispatchAction({
              type: "play_card",
              playerId: viewingPlayerId,
              cardId: card.id,
            });
          });
        }
        ui.hand.appendChild(cardEl);
      });
    }

    ui.handMeta.textContent =
      meIndex >= 0
        ? `${me.hand.length} cards | Draw pile ${state.drawPileCount ?? state.drawPile.length}`
        : "";
  }

  const playableCards =
    meIndex >= 0 ? getPlayableCards(state, meIndex) : [];
  const canDraw =
    isMyTurn &&
    !state.awaitingColor &&
    !state.drawRestriction &&
    (!state.options.mustDrawOnlyIfNoPlay || playableCards.length === 0);
  const canPass =
    isMyTurn &&
    !state.awaitingColor &&
    (state.drawRestriction || playableCards.length === 0);

  ui.drawBtn.disabled = !canDraw;
  ui.passBtn.disabled = !canPass;
  ui.drawBtn.classList.toggle("disabled", !canDraw);
  ui.passBtn.classList.toggle("disabled", !canPass);

  ui.unoBtn.classList.toggle(
    "hidden",
    !(state.unoPendingPlayerId && state.unoPendingPlayerId === viewingPlayerId)
  );
  ui.callUnoBtn.classList.toggle(
    "hidden",
    !(
      state.unoPendingPlayerId &&
      state.unoPendingPlayerId !== viewingPlayerId
    )
  );

  ui.log.innerHTML = "";
  (state.log || []).slice(0, 16).forEach((entry) => {
    const line = document.createElement("p");
    line.textContent = entry;
    ui.log.appendChild(line);
  });

  if (state.awaitingColor && viewingPlayerId === state.awaitingColorPlayerId) {
    ui.colorOverlay.classList.remove("hidden");
  } else {
    ui.colorOverlay.classList.add("hidden");
  }
}

function dispatchAction(action) {
  if (mode === "online") {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(action));
    }
    return;
  }
  const prevPlayerId =
    localState?.players[localState.currentPlayerIndex]?.id ?? null;
  const result = applyAction(localState, action);
  if (result.error) {
    showNotice(result.error);
    return;
  }
  const nextPlayerId =
    localState?.players[localState.currentPlayerIndex]?.id ?? null;
  if (
    prevPlayerId &&
    nextPlayerId &&
    prevPlayerId !== nextPlayerId &&
    localState.phase !== "finished"
  ) {
    passPending = true;
  }
  if (localState.phase === "finished") {
    passPending = false;
  }
  render();
}

function startLocalGame() {
  const names = Array.from(ui.playerInputs.querySelectorAll("input")).map(
    (input) => input.value.trim() || "Player"
  );
  const players = names.map((name, index) => ({
    id: `p${index + 1}`,
    name,
  }));
  const options = {
    unoPenalty: ui.ruleUnoPenalty.checked,
    enforceWildDrawFour: ui.ruleStrictWild.checked,
    mustDrawOnlyIfNoPlay: ui.ruleMustDraw.checked,
  };
  passPending = false;
  localState = createGame({ players, options });
  setStatus("Local");
  ui.setupPanel.classList.add("hidden");
  render();
}

function resetToSetup() {
  localState = null;
  onlineState = null;
  passPending = false;
  ui.setupPanel.classList.remove("hidden");
  ui.gamePanel.classList.add("hidden");
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
  roomCode = code;
  ui.roomCode.value = code;

  if (socket) {
    socket.close();
  }

  socket = new WebSocket(url);
  setStatus("Connecting...");

  socket.addEventListener("open", () => {
    socket.send(
      JSON.stringify({
        type: "hello",
        name,
        room: code,
        create,
        options: {
          unoPenalty: ui.onlineRuleUnoPenalty.checked,
          enforceWildDrawFour: ui.onlineRuleStrictWild.checked,
          mustDrawOnlyIfNoPlay: ui.onlineRuleMustDraw.checked,
        },
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
        line.textContent = player.name;
        ui.lobbyPlayers.appendChild(line);
      });
      ui.startOnline.disabled = !isHost;
      ui.hostHint.textContent = isHost
        ? "You are the host. Start when everyone is ready."
        : "Waiting for the host to start.";
    }
    if (message.type === "game_state") {
      onlineState = message.state;
      ui.setupPanel.classList.add("hidden");
      render();
    }
    if (message.type === "error") {
      showNotice(message.message);
    }
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

ui.modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

ui.playerMinus.addEventListener("click", () => {
  const count = Math.max(2, Number(ui.playerCount.textContent) - 1);
  ui.playerCount.textContent = String(count);
  updatePlayerInputs(count);
});

ui.playerPlus.addEventListener("click", () => {
  const count = Math.min(6, Number(ui.playerCount.textContent) + 1);
  ui.playerCount.textContent = String(count);
  updatePlayerInputs(count);
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
ui.startOnline.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "start_game",
        options: {
          unoPenalty: ui.onlineRuleUnoPenalty.checked,
          enforceWildDrawFour: ui.onlineRuleStrictWild.checked,
          mustDrawOnlyIfNoPlay: ui.onlineRuleMustDraw.checked,
        },
      })
    );
  }
});
ui.leaveRoom.addEventListener("click", leaveRoom);

ui.drawBtn.addEventListener("click", () => {
  dispatchAction({ type: "draw_card", playerId: currentViewingPlayerId(currentState()) });
});

ui.passBtn.addEventListener("click", () => {
  dispatchAction({ type: "pass_turn", playerId: currentViewingPlayerId(currentState()) });
});

ui.unoBtn.addEventListener("click", () => {
  dispatchAction({ type: "declare_uno", playerId: currentViewingPlayerId(currentState()) });
});

ui.callUnoBtn.addEventListener("click", () => {
  dispatchAction({ type: "call_uno", playerId: currentViewingPlayerId(currentState()) });
});

ui.restartLocal.addEventListener("click", resetToSetup);

ui.passReady.addEventListener("click", () => {
  const unoPlayer = ui.passReady.dataset.unoPlayer;
  if (unoPlayer) {
    dispatchAction({ type: "declare_uno", playerId: unoPlayer });
  }
  passPending = false;
  render();
});

ui.colorChoices.forEach((button) => {
  button.addEventListener("click", () => {
    const color = button.dataset.color;
    dispatchAction({
      type: "choose_color",
      playerId: currentViewingPlayerId(currentState()),
      color,
    });
  });
});

updatePlayerInputs(3);
setMode("local");
