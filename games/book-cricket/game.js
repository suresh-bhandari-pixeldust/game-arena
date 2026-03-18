// Book Cricket — Pure Game Engine (ES module)
// Classic Indian school game: open a book page, last digit = runs, 0 = OUT

function pushLog(state, message) {
  state.log = state.log || [];
  state.log.unshift(message);
  if (state.log.length > 80) {
    state.log.length = 80;
  }
}

function generatePageNumber() {
  return Math.floor(Math.random() * 500) + 1; // 1-500
}

function runsFromPage(page) {
  const lastDigit = page % 10;
  return lastDigit; // 0 = OUT, 8 = OUT, rest = face value
}

function runLabel(runs) {
  if (runs === 0) return "OUT!";
  if (runs === 8) return "OUT!";
  if (runs === 4) return "FOUR!";
  if (runs === 6) return "SIX!";
  return `${runs} run${runs !== 1 ? "s" : ""}`;
}

export function createGame({ players, options = {} }) {
  const maxWickets = options.maxWickets || 10;
  const maxOvers = options.maxOvers || 0; // 0 = unlimited

  const gamePlayers = players.map((player) => ({
    id: player.id,
    name: player.name,
    isBot: Boolean(player.isBot),
    score: 0,
    balls: [],       // [{page, runs, isOut}]
    isOut: false,
    wickets: 0,
  }));

  const state = {
    players: gamePlayers,
    currentBatterIndex: 0,
    phase: "batting",    // batting | chasing | finished
    inningsComplete: 0,  // 0 = first innings, 1 = second innings done
    target: null,
    winnerId: null,
    log: [],
    options: { maxWickets, maxOvers },
  };

  pushLog(state, `${gamePlayers[0].name} is batting first!`);
  pushLog(state, "Open the book to score runs. Last digit 0 or 8 = OUT!");

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

  if (type === "open_page") {
    const batter = state.players[state.currentBatterIndex];
    if (batter.id !== playerId) {
      return { state, error: "Not your turn to bat." };
    }
    if (batter.isOut) {
      return { state, error: "You are already out." };
    }

    const page = action.page || generatePageNumber();
    const runs = runsFromPage(page);
    const isOut = runs === 0 || runs === 8;

    const ball = { page, runs, isOut };
    batter.balls.push(ball);

    if (isOut) {
      batter.isOut = true;
      batter.wickets += 1;
      pushLog(state, `Page ${page} -- ${batter.name} is OUT! Total: ${batter.score}`);

      // Check if innings ends
      if (state.phase === "batting") {
        // First innings over
        state.target = batter.score + 1;
        state.inningsComplete = 1;
        state.phase = "chasing";
        state.currentBatterIndex = 1;
        pushLog(state, `--- End of 1st Innings ---`);
        pushLog(state, `${batter.name} scored ${batter.score} runs.`);
        pushLog(state, `${state.players[1].name} needs ${state.target} to win!`);
      } else if (state.phase === "chasing") {
        // Second innings, chaser is out
        state.phase = "finished";
        state.inningsComplete = 2;
        const firstBatter = state.players[0];
        if (batter.score > firstBatter.score) {
          state.winnerId = batter.id;
          pushLog(state, `${batter.name} wins by scoring more before getting out!`);
        } else if (batter.score === firstBatter.score) {
          // Tie
          state.winnerId = null;
          pushLog(state, `It's a TIE! Both scored ${batter.score} runs!`);
        } else {
          state.winnerId = firstBatter.id;
          pushLog(state, `${firstBatter.name} wins! ${batter.name} fell short by ${firstBatter.score - batter.score} runs.`);
        }
        pushLog(state, `--- Match Over ---`);
      }
    } else {
      batter.score += runs;
      const isBoundary = runs === 4 || runs === 6;
      const emoji = isBoundary ? (runs === 4 ? " FOUR!" : " SIX!") : "";
      pushLog(state, `Page ${page} -- ${runs} run${runs !== 1 ? "s" : ""}${emoji} (${batter.name}: ${batter.score})`);

      // Check if chaser has reached target
      if (state.phase === "chasing" && state.target && batter.score >= state.target) {
        state.phase = "finished";
        state.inningsComplete = 2;
        state.winnerId = batter.id;
        const margin = batter.score - (state.target - 1);
        pushLog(state, `${batter.name} chased it down! Wins by ${margin} run${margin !== 1 ? "s" : ""}!`);
        pushLog(state, `--- Match Over ---`);
      }
    }

    return { state, ball };
  }

  return { state, error: "Unknown action." };
}

export function sanitizeStateForPlayer(state, playerId) {
  return { ...state };
}

export function getBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player || player.isOut) return null;
  if (state.currentBatterIndex !== playerIndex) return null;
  if (state.phase === "finished") return null;

  return { type: "open_page", playerId: player.id };
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
