// Raja Mantri Chor Sipahi — Pure Game Engine
// Classic Indian card game with 4 roles: Raja, Mantri, Chor, Sipahi

const ROLES = ["Raja", "Mantri", "Chor", "Sipahi"];

const ROLE_INFO = {
  Raja:   { points: 1000, label: "Raja (King)",       emoji: "crown",   color: "#d4af37" },
  Mantri: { points: 800,  label: "Mantri (Minister)", emoji: "scroll",  color: "#9b59b6" },
  Chor:   { points: 0,    label: "Chor (Thief)",      emoji: "mask",    color: "#e74c3c" },
  Sipahi: { points: 500,  label: "Sipahi (Police)",   emoji: "shield",  color: "#3498db" },
};

export { ROLES, ROLE_INFO };

function shuffle(array, rng = Math.random) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pushLog(state, message) {
  state.log = state.log || [];
  state.log.unshift(message);
  if (state.log.length > 50) {
    state.log.length = 50;
  }
}

function dealRoles(state) {
  const shuffled = shuffle(ROLES);
  for (let i = 0; i < state.players.length; i += 1) {
    state.players[i].role = shuffled[i];
    state.players[i].revealedRole = null;
  }
}

function startNewRound(state) {
  state.round += 1;
  state.roundGuess = null;
  state.roundGuessCorrect = null;
  state.mantriGuessTargetId = null;
  dealRoles(state);
  state.phase = "raja_reveal";

  pushLog(state, `--- Round ${state.round} ---`);
  pushLog(state, "Chits have been dealt. Who is the Raja?");
}

function scoreRound(state, mantriCorrect) {
  for (const p of state.players) {
    if (p.role === "Raja") {
      p.score += 1000;
      p.revealedRole = "Raja";
    } else if (p.role === "Mantri") {
      p.score += mantriCorrect ? 800 : 0;
      p.revealedRole = "Mantri";
    } else if (p.role === "Chor") {
      p.score += mantriCorrect ? 0 : 800;
      p.revealedRole = "Chor";
    } else if (p.role === "Sipahi") {
      p.score += mantriCorrect ? 500 : 0;
      p.revealedRole = "Sipahi";
    }
  }
}

export function createGame({ players, options = {} }) {
  const totalRounds = (options && options.totalRounds) || 5;

  // Cap at 4 players — RMCS has exactly 4 roles
  const gamePlayers = players.slice(0, 4).map((player) => ({
    id: player.id,
    name: player.name,
    isBot: Boolean(player.isBot),
    role: null,
    revealedRole: null,
    score: 0,
  }));

  // Fill remaining slots with bots to ensure exactly 4 players
  while (gamePlayers.length < 4) {
    const botIndex = gamePlayers.length;
    const botNames = ["Akbar", "Birbal", "Tenali", "Chanakya", "Shakuni", "Vikram"];
    gamePlayers.push({
      id: `bot${botIndex}`,
      name: `${botNames[botIndex % botNames.length]} (Bot)`,
      isBot: true,
      role: null,
      revealedRole: null,
      score: 0,
    });
  }

  const state = {
    players: gamePlayers,
    phase: "dealing", // dealing -> raja_reveal -> guessing -> results -> finished
    round: 0,
    totalRounds,
    roundGuess: null,
    roundGuessCorrect: null,
    mantriGuessTargetId: null,
    winnerId: null,
    log: [],
    options: options || {},
  };

  pushLog(state, "Welcome to Raja Mantri Chor Sipahi!");
  pushLog(state, `Playing ${totalRounds} rounds. Highest cumulative score wins.`);

  // Immediately start round 1
  startNewRound(state);

  return state;
}

export function applyAction(state, action) {
  if (!state) {
    return { state, error: "Game not started." };
  }
  if (state.phase === "finished") {
    return { state, error: "Game finished." };
  }

  const { type, playerId } = action;
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex < 0) {
    return { state, error: "Unknown player." };
  }

  if (type === "reveal_raja") {
    if (state.phase !== "raja_reveal") {
      return { state, error: "Not in raja reveal phase." };
    }

    const player = state.players[playerIndex];
    if (player.role !== "Raja") {
      return { state, error: "You are not the Raja!" };
    }

    player.revealedRole = "Raja";
    state.phase = "guessing";

    pushLog(state, `${player.name} reveals themselves as the Raja!`);
    pushLog(state, "The Mantri must now identify the Chor.");

    return { state };
  }

  if (type === "guess_chor") {
    if (state.phase !== "guessing") {
      return { state, error: "Not in guessing phase." };
    }

    const player = state.players[playerIndex];
    if (player.role !== "Mantri") {
      return { state, error: "Only the Mantri can guess." };
    }

    const targetId = action.targetId;
    const target = state.players.find((p) => p.id === targetId);
    if (!target) {
      return { state, error: "Invalid target." };
    }
    if (target.role === "Raja") {
      return { state, error: "The Raja is already revealed. Pick someone else." };
    }
    if (target.id === player.id) {
      return { state, error: "You cannot pick yourself." };
    }

    const correct = target.role === "Chor";
    state.roundGuess = targetId;
    state.roundGuessCorrect = correct;
    state.mantriGuessTargetId = targetId;

    pushLog(state, `${player.name} (Mantri) points at ${target.name}...`);

    if (correct) {
      pushLog(state, `Correct! ${target.name} is the Chor!`);
    } else {
      pushLog(state, `Wrong! ${target.name} is the Sipahi, not the Chor!`);
    }

    // Score the round
    scoreRound(state, correct);

    // Log scores
    const rajaP = state.players.find((p) => p.role === "Raja");
    const mantriP = state.players.find((p) => p.role === "Mantri");
    const chorP = state.players.find((p) => p.role === "Chor");
    const sipahiP = state.players.find((p) => p.role === "Sipahi");

    pushLog(state, `Raja (${rajaP.name}): +1000`);
    if (correct) {
      pushLog(state, `Mantri (${mantriP.name}): +800`);
      pushLog(state, `Sipahi (${sipahiP.name}): +500`);
      pushLog(state, `Chor (${chorP.name}): +0`);
    } else {
      pushLog(state, `Chor (${chorP.name}): +800 (gets Mantri's points!)`);
      pushLog(state, `Mantri (${mantriP.name}): +0`);
      pushLog(state, `Sipahi (${sipahiP.name}): +0`);
    }

    state.phase = "results";

    // Check if game is over
    if (state.round >= state.totalRounds) {
      // Determine winner
      let best = state.players[0];
      for (const p of state.players) {
        if (p.score > best.score) best = p;
      }
      state.winnerId = best.id;
      state.phase = "finished";
      pushLog(state, `Game over! ${best.name} wins with ${best.score} points!`);
    }

    return { state };
  }

  if (type === "next_round") {
    if (state.phase !== "results") {
      return { state, error: "Not in results phase." };
    }

    startNewRound(state);
    return { state };
  }

  return { state, error: "Unknown action." };
}

export function sanitizeStateForPlayer(state, playerId) {
  return {
    ...state,
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      isBot: player.isBot,
      score: player.score,
      revealedRole: player.revealedRole,
      // Only show role to the player themselves, or during results/finished
      role:
        player.id === playerId ||
        state.phase === "results" ||
        state.phase === "finished"
          ? player.role
          : null,
    })),
  };
}

export function getBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player) return null;

  if (state.phase === "raja_reveal" && player.role === "Raja") {
    return { type: "reveal_raja", playerId: player.id };
  }

  if (state.phase === "guessing" && player.role === "Mantri") {
    // Bot picks randomly among non-Raja, non-self players
    const candidates = state.players.filter(
      (p) => p.id !== player.id && p.revealedRole !== "Raja"
    );
    if (candidates.length === 0) return null;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    return { type: "guess_chor", playerId: player.id, targetId: target.id };
  }

  if (state.phase === "results") {
    return { type: "next_round", playerId: player.id };
  }

  return null;
}

// Compatibility stubs for the platform
export function getPlayableCards() {
  return [];
}

export function getCurrentColor() {
  return null;
}

export function getTopCard() {
  return null;
}
