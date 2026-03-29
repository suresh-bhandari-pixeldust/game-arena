// Hand Cricket (Odd-Even) — Pure Game Engine

function pushLog(state, message) {
  state.log = state.log || [];
  state.log.unshift(message);
  if (state.log.length > 50) {
    state.log.length = 50;
  }
}

export function createGame({ players, options = {} }) {
  if (players.length < 2) {
    throw new Error("Hand Cricket requires exactly 2 players.");
  }

  const gamePlayers = players.slice(0, 2).map((player) => ({
    id: player.id,
    name: player.name,
    isBot: Boolean(player.isBot),
    score: 0,
  }));

  const state = {
    players: gamePlayers,
    phase: "toss_choose", // toss_choose | toss_flip | bat_or_bowl | batting | chasing | finished
    // Toss state
    tossCallerId: gamePlayers[0].id, // first player calls odd/even
    tossCall: null, // "odd" | "even"
    tossNumbers: {}, // { playerId: number }
    tossWinnerId: null,
    // Batting state
    currentBatterId: null,
    currentBowlerId: null,
    innings: 0, // 0 = not started, 1 = first innings, 2 = second innings
    target: null, // set after first innings
    // Round state (each ball)
    pendingNumbers: {}, // { playerId: number } — collected before reveal
    lastBatterNumber: null,
    lastBowlerNumber: null,
    lastResult: null, // "scored" | "out"
    balls: [], // history: [{batter, bowler, batterNum, bowlerNum, result, runsScored}]
    winnerId: null,
    log: [],
    options,
  };

  pushLog(state, `Hand Cricket begins! ${gamePlayers[0].name} calls Odd or Even for the toss.`);

  return state;
}

export function applyAction(state, action) {
  if (!state) return { state, error: "Game not started." };
  if (state.phase === "finished") return { state, error: "Game finished." };

  const { type, playerId } = action;
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex < 0) return { state, error: "Unknown player." };

  // ─── TOSS: Choose Odd or Even ───
  if (type === "toss_call") {
    if (state.phase !== "toss_choose") return { state, error: "Not in toss call phase." };
    if (playerId !== state.tossCallerId) return { state, error: "Not your turn to call." };
    const call = action.call; // "odd" | "even"
    if (call !== "odd" && call !== "even") return { state, error: "Call must be 'odd' or 'even'." };

    state.tossCall = call;
    state.phase = "toss_flip";
    state.pendingNumbers = {};

    pushLog(state, `${state.players[playerIndex].name} calls ${call.toUpperCase()}!`);
    pushLog(state, "Both players: show a number (1-6) for the toss!");

    return { state };
  }

  // ─── TOSS: Both pick numbers ───
  if (type === "toss_number") {
    if (state.phase !== "toss_flip") return { state, error: "Not in toss flip phase." };
    const num = action.number;
    if (!Number.isInteger(num) || num < 1 || num > 6) return { state, error: "Pick a number 1-6." };

    state.pendingNumbers[playerId] = num;

    // Check if both players have picked
    if (Object.keys(state.pendingNumbers).length < 2) {
      return { state };
    }

    // Resolve toss
    const p0 = state.players[0];
    const p1 = state.players[1];
    const n0 = state.pendingNumbers[p0.id];
    const n1 = state.pendingNumbers[p1.id];
    const sum = n0 + n1;
    const isOdd = sum % 2 === 1;
    const callerWins = (state.tossCall === "odd" && isOdd) || (state.tossCall === "even" && !isOdd);

    const caller = state.players.find((p) => p.id === state.tossCallerId);
    const other = state.players.find((p) => p.id !== state.tossCallerId);

    state.tossWinnerId = callerWins ? caller.id : other.id;
    const winner = state.players.find((p) => p.id === state.tossWinnerId);

    pushLog(state, `${p0.name} showed ${n0}, ${p1.name} showed ${n1}. Sum = ${sum} (${isOdd ? "ODD" : "EVEN"}).`);
    pushLog(state, `${winner.name} wins the toss! Choose to BAT or BOWL.`);

    state.lastBatterNumber = n0;
    state.lastBowlerNumber = n1;
    state.phase = "bat_or_bowl";
    state.pendingNumbers = {};

    return { state };
  }

  // ─── TOSS WINNER: Choose bat or bowl ───
  if (type === "choose_role") {
    if (state.phase !== "bat_or_bowl") return { state, error: "Not choosing role." };
    if (playerId !== state.tossWinnerId) return { state, error: "Only toss winner can choose." };
    const role = action.role; // "bat" | "bowl"
    if (role !== "bat" && role !== "bowl") return { state, error: "Choose 'bat' or 'bowl'." };

    const winner = state.players.find((p) => p.id === state.tossWinnerId);
    const loser = state.players.find((p) => p.id !== state.tossWinnerId);

    if (role === "bat") {
      state.currentBatterId = winner.id;
      state.currentBowlerId = loser.id;
    } else {
      state.currentBatterId = loser.id;
      state.currentBowlerId = winner.id;
    }

    state.innings = 1;
    state.phase = "batting";
    state.pendingNumbers = {};
    state.lastBatterNumber = null;
    state.lastBowlerNumber = null;
    state.lastResult = null;

    const batter = state.players.find((p) => p.id === state.currentBatterId);
    pushLog(state, `${winner.name} chose to ${role.toUpperCase()}. ${batter.name} is batting first!`);

    return { state };
  }

  // ─── BATTING: Both pick numbers ───
  if (type === "choose_number") {
    if (state.phase !== "batting" && state.phase !== "chasing") {
      return { state, error: "Not in a batting phase." };
    }
    const num = action.number;
    if (!Number.isInteger(num) || num < 1 || num > 6) return { state, error: "Pick a number 1-6." };

    state.pendingNumbers[playerId] = num;

    // Need both players
    if (Object.keys(state.pendingNumbers).length < 2) {
      return { state };
    }

    // Resolve the ball
    const batterNum = state.pendingNumbers[state.currentBatterId];
    const bowlerNum = state.pendingNumbers[state.currentBowlerId];
    const batter = state.players.find((p) => p.id === state.currentBatterId);
    const bowler = state.players.find((p) => p.id === state.currentBowlerId);

    state.lastBatterNumber = batterNum;
    state.lastBowlerNumber = bowlerNum;
    state.pendingNumbers = {};

    if (batterNum === bowlerNum) {
      // OUT!
      state.lastResult = "out";
      state.balls.push({
        innings: state.innings,
        batterId: state.currentBatterId,
        bowlerId: state.currentBowlerId,
        batterNum,
        bowlerNum,
        result: "out",
        runsScored: 0,
      });

      pushLog(state, `${batter.name}: ${batterNum} vs ${bowler.name}: ${bowlerNum} — SAME NUMBER! ${batter.name} is OUT!`);

      if (state.phase === "batting") {
        // First innings over — set target, swap roles
        state.target = batter.score + 1;
        pushLog(state, `First innings over! ${batter.name} scored ${batter.score}. Target: ${state.target}.`);

        // Swap batter/bowler
        const oldBatterId = state.currentBatterId;
        state.currentBatterId = state.currentBowlerId;
        state.currentBowlerId = oldBatterId;
        state.innings = 2;
        state.phase = "chasing";
        state.lastBatterNumber = null;
        state.lastBowlerNumber = null;
        state.lastResult = null;

        const newBatter = state.players.find((p) => p.id === state.currentBatterId);
        pushLog(state, `${newBatter.name} is now batting. Need ${state.target} to win!`);
      } else {
        // Second innings (chasing) — batter is out, first batter wins
        const firstBatter = state.players.find((p) => p.id === state.currentBowlerId);
        const secondBatter = batter;

        state.winnerId = firstBatter.id;
        state.phase = "finished";
        const winner = state.players.find((p) => p.id === state.winnerId);
        const margin = (state.target - 1) - secondBatter.score;
        pushLog(state, `${winner.name} wins by ${margin} run${margin !== 1 ? "s" : ""}!`);
      }
    } else {
      // Runs scored
      state.lastResult = "scored";
      batter.score += batterNum;
      state.balls.push({
        innings: state.innings,
        batterId: state.currentBatterId,
        bowlerId: state.currentBowlerId,
        batterNum,
        bowlerNum,
        result: "scored",
        runsScored: batterNum,
      });

      pushLog(state, `${batter.name}: ${batterNum} vs ${bowler.name}: ${bowlerNum} — ${batter.name} scores ${batterNum}! (Total: ${batter.score})`);

      // Check if chasing team has won
      if (state.phase === "chasing" && batter.score >= state.target) {
        state.winnerId = batter.id;
        state.phase = "finished";
        const margin = 2 - 1; // won by wickets (1 wicket remaining = "with wickets to spare" but in hand cricket it's simpler)
        pushLog(state, `${batter.name} wins! Chased down ${state.target} successfully!`);
      }
    }

    return { state };
  }

  return { state, error: "Unknown action." };
}

export function sanitizeStateForPlayer(state, playerId) {
  // Hide opponent's pending number choice
  const sanitized = { ...state };
  const pendingNumbers = {};
  if (state.pendingNumbers[playerId] !== undefined) {
    pendingNumbers[playerId] = state.pendingNumbers[playerId];
  }
  // Show opponent has picked but not what they picked
  for (const id of Object.keys(state.pendingNumbers)) {
    if (id !== playerId) {
      pendingNumbers[id] = -1; // hidden
    }
  }
  sanitized.pendingNumbers = pendingNumbers;
  return sanitized;
}

export function getBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player) return null;

  if (state.phase === "toss_choose" && player.id === state.tossCallerId) {
    const call = Math.random() < 0.5 ? "odd" : "even";
    return { type: "toss_call", playerId: player.id, call };
  }

  if (state.phase === "toss_flip" && state.pendingNumbers[player.id] === undefined) {
    const num = Math.floor(Math.random() * 6) + 1;
    return { type: "toss_number", playerId: player.id, number: num };
  }

  if (state.phase === "bat_or_bowl" && player.id === state.tossWinnerId) {
    const role = Math.random() < 0.5 ? "bat" : "bowl";
    return { type: "choose_role", playerId: player.id, role };
  }

  if ((state.phase === "batting" || state.phase === "chasing") && state.pendingNumbers[player.id] === undefined) {
    const num = Math.floor(Math.random() * 6) + 1;
    return { type: "choose_number", playerId: player.id, number: num };
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
