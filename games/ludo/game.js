// Ludo — Pure Game Engine
// Classic Ludo board game for 2-4 players

const PLAYER_COLORS = ["red", "blue", "green", "yellow"];

// Board layout: 52 shared squares around the perimeter
// Each player has a start position, a home column of 6 squares, and 4 tokens
// Player start positions on the main track (where tokens enter after leaving home base)
const PLAYER_START = [0, 13, 26, 39];
// The square just before a player's home column entry
const PLAYER_HOME_ENTRY = [50, 11, 24, 37];
// Safe spots (can't be captured here)
const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];

const BOARD_SIZE = 52; // main track squares
const HOME_COLUMN_LENGTH = 6; // 6 squares to reach finish
const TOKENS_PER_PLAYER = 4;

function pushLog(state, message) {
  state.log = state.log || [];
  state.log.unshift(message);
  if (state.log.length > 50) {
    state.log.length = 50;
  }
}

// Convert a player-relative position to absolute board position
// position 0 = in base, 1-56 = on track (1 = start square, 52 = last shared, 53-58 = home column)
// Returns { onTrack: absolute_pos } or { inHomeColumn: col_index } or { inBase: true } or { finished: true }
function resolvePosition(playerIndex, position) {
  if (position === 0) return { inBase: true };
  if (position >= 57) return { finished: true };
  if (position > 50) {
    return { inHomeColumn: position - 51 }; // 0-5
  }
  // On the main track: offset by player start
  const absolute = (PLAYER_START[playerIndex] + position - 1) % BOARD_SIZE;
  return { onTrack: absolute };
}

function canMoveToken(state, playerIndex, tokenIndex, diceValue) {
  const token = state.players[playerIndex].tokens[tokenIndex];
  if (token.finished) return false;

  const pos = token.position;

  // In base: need a 6 to come out
  if (pos === 0) {
    return diceValue === 6;
  }

  // On track or in home column
  const newPos = pos + diceValue;

  // Can't overshoot the finish (position 57 = finished, max is 57)
  if (newPos > 57) return false;

  // Check if landing on own token in home column
  if (newPos > 50 && newPos < 57) {
    const homeColIdx = newPos - 51;
    for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
      if (i === tokenIndex) continue;
      const other = state.players[playerIndex].tokens[i];
      if (!other.finished && other.position === newPos) {
        return false; // can't land on own token in home column
      }
    }
  }

  // Check if landing on own token on the main track
  if (newPos >= 1 && newPos <= 50) {
    const resolved = resolvePosition(playerIndex, newPos);
    if (resolved.onTrack !== undefined) {
      for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
        if (i === tokenIndex) continue;
        const other = state.players[playerIndex].tokens[i];
        if (!other.finished && other.position >= 1 && other.position <= 50) {
          const otherResolved = resolvePosition(playerIndex, other.position);
          if (otherResolved.onTrack === resolved.onTrack) {
            return false; // can't land on own token
          }
        }
      }
    }
  }

  return true;
}

function getMovableTokens(state, playerIndex, diceValue) {
  const movable = [];
  for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
    if (canMoveToken(state, playerIndex, i, diceValue)) {
      movable.push(i);
    }
  }
  return movable;
}

function checkPlayerWin(state, playerIndex) {
  const player = state.players[playerIndex];
  return player.tokens.every((t) => t.finished);
}

function nextPlayerIndex(state, currentIndex) {
  const total = state.players.length;
  let idx = (currentIndex + 1) % total;
  // Skip eliminated players (all finished) — actually in Ludo once you finish you're done
  // But we keep going for remaining players. If only one left, game is over.
  let attempts = 0;
  while (attempts < total) {
    if (!state.players[idx].hasWon) return idx;
    idx = (idx + 1) % total;
    attempts++;
  }
  return -1;
}

function checkGameEnd(state) {
  const activePlayers = state.players.filter((p) => !p.hasWon);
  if (activePlayers.length <= 1) {
    if (activePlayers.length === 1) {
      // Last player remaining
      state.winnerId = state.players.find((p) => p.hasWon)?.id || activePlayers[0].id;
    }
    state.phase = "finished";
    return true;
  }
  return false;
}

export function createGame({ players, options = {} }) {
  const gamePlayers = players.map((player, idx) => ({
    id: player.id,
    name: player.name,
    isBot: Boolean(player.isBot),
    color: PLAYER_COLORS[idx],
    tokens: Array.from({ length: TOKENS_PER_PLAYER }, (_, ti) => ({
      index: ti,
      position: 0, // 0 = in base
      finished: false,
    })),
    hasWon: false,
    finishOrder: 0,
  }));

  const state = {
    players: gamePlayers,
    currentPlayerIndex: 0,
    phase: "playing", // playing | finished
    subPhase: "roll_dice", // roll_dice | move_token
    winnerId: null,
    diceValue: null,
    extraTurn: false,
    consecutiveSixes: 0,
    movableTokens: [],
    log: [],
    options,
    finishCount: 0,
  };

  pushLog(state, `Game begins! ${gamePlayers[0].name} rolls first.`);
  return state;
}

export function applyAction(state, action) {
  if (!state) return { state, error: "Game not started." };
  if (state.phase === "finished") return { state, error: "Game finished." };

  const { type, playerId } = action;
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex < 0) return { state, error: "Unknown player." };

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return { state, error: "Not your turn." };

  if (type === "roll_dice") {
    if (state.subPhase !== "roll_dice") {
      return { state, error: "You need to move a token, not roll." };
    }

    const dice = Math.floor(Math.random() * 6) + 1;
    state.diceValue = dice;

    pushLog(state, `${currentPlayer.name} rolled a ${dice}`);

    // Three consecutive 6s rule: forfeit turn and send all tokens back to base
    if (dice === 6) {
      state.consecutiveSixes = (state.consecutiveSixes || 0) + 1;
      if (state.consecutiveSixes >= 3) {
        pushLog(state, `${currentPlayer.name} rolled three 6s in a row! Turn forfeited.`);
        state.consecutiveSixes = 0;
        state.diceValue = null;
        state.movableTokens = [];
        state.extraTurn = false;
        state.subPhase = "roll_dice";
        const next = nextPlayerIndex(state, state.currentPlayerIndex);
        if (next >= 0) {
          state.currentPlayerIndex = next;
          pushLog(state, `${state.players[next].name}'s turn.`);
        } else {
          checkGameEnd(state);
        }
        return { state };
      }
    } else {
      state.consecutiveSixes = 0;
    }

    // Check if any token can move
    const movable = getMovableTokens(state, state.currentPlayerIndex, dice);
    state.movableTokens = movable;

    if (movable.length === 0) {
      pushLog(state, `${currentPlayer.name} has no valid moves.`);
      // If rolled a 6, still get extra turn? No — standard rule: no moves means turn passes
      state.diceValue = null;
      state.movableTokens = [];
      state.extraTurn = false;
      state.subPhase = "roll_dice";

      if (!state.players[state.currentPlayerIndex].hasWon) {
        const next = nextPlayerIndex(state, state.currentPlayerIndex);
        if (next >= 0) {
          state.currentPlayerIndex = next;
          pushLog(state, `${state.players[next].name}'s turn.`);
        } else {
          checkGameEnd(state);
        }
      }
      return { state };
    }

    if (movable.length === 1) {
      // Auto-move the only option
      return applyAction(state, {
        type: "move_token",
        playerId,
        tokenIndex: movable[0],
      });
    }

    // Multiple options — player must choose
    state.subPhase = "move_token";
    return { state };
  }

  if (type === "move_token") {
    const tokenIndex = action.tokenIndex;
    if (tokenIndex === undefined || tokenIndex < 0 || tokenIndex >= TOKENS_PER_PLAYER) {
      return { state, error: "Invalid token index." };
    }

    const dice = state.diceValue;
    if (dice === null) return { state, error: "Roll the dice first." };

    if (!canMoveToken(state, state.currentPlayerIndex, tokenIndex, dice)) {
      return { state, error: "Can't move that token." };
    }

    const token = currentPlayer.tokens[tokenIndex];
    const oldPos = token.position;
    let captured = false;

    if (oldPos === 0) {
      // Moving out of base
      token.position = 1; // start square (player-relative)
      pushLog(state, `${currentPlayer.name} brings token ${tokenIndex + 1} onto the board!`);

      // Check for capture at start position
      const startAbs = PLAYER_START[state.currentPlayerIndex];
      if (!SAFE_SPOTS.includes(startAbs)) {
        captured = captureAtPosition(state, state.currentPlayerIndex, startAbs);
      }
    } else {
      const newPos = oldPos + dice;
      token.position = newPos;

      if (newPos >= 57) {
        // Token reached finish
        token.finished = true;
        token.position = 57;
        pushLog(state, `${currentPlayer.name}'s token ${tokenIndex + 1} reached home!`);

        if (checkPlayerWin(state, state.currentPlayerIndex)) {
          state.finishCount++;
          currentPlayer.hasWon = true;
          currentPlayer.finishOrder = state.finishCount;

          if (state.finishCount === 1) {
            state.winnerId = currentPlayer.id;
            pushLog(state, `${currentPlayer.name} wins the game!`);
          } else {
            pushLog(state, `${currentPlayer.name} finishes in position ${state.finishCount}!`);
          }

          if (checkGameEnd(state)) {
            return { state };
          }
        }
      } else if (newPos <= 50) {
        // On main track — check for capture
        const resolved = resolvePosition(state.currentPlayerIndex, newPos);
        if (resolved.onTrack !== undefined && !SAFE_SPOTS.includes(resolved.onTrack)) {
          captured = captureAtPosition(state, state.currentPlayerIndex, resolved.onTrack);
        }
        pushLog(state, `${currentPlayer.name} moves token ${tokenIndex + 1}`);
      } else {
        pushLog(state, `${currentPlayer.name} moves token ${tokenIndex + 1} into home column`);
      }
    }

    // Determine next turn
    const gotSix = dice === 6;
    const earnedExtraTurn = gotSix || captured;

    state.diceValue = null;
    state.movableTokens = [];

    if (earnedExtraTurn && !currentPlayer.hasWon) {
      state.extraTurn = true;
      state.subPhase = "roll_dice";
      if (gotSix) pushLog(state, `${currentPlayer.name} rolled a 6 — extra turn!`);
      if (captured && !gotSix) pushLog(state, `${currentPlayer.name} captured — extra turn!`);
    } else {
      state.extraTurn = false;
      state.consecutiveSixes = 0;
      state.subPhase = "roll_dice";
      const next = nextPlayerIndex(state, state.currentPlayerIndex);
      if (next >= 0) {
        state.currentPlayerIndex = next;
        pushLog(state, `${state.players[next].name}'s turn.`);
      } else {
        checkGameEnd(state);
      }
    }

    return { state };
  }

  return { state, error: "Unknown action." };
}

function captureAtPosition(state, attackerIndex, absolutePos) {
  let captured = false;
  for (let pi = 0; pi < state.players.length; pi++) {
    if (pi === attackerIndex) continue;
    for (const token of state.players[pi].tokens) {
      if (token.finished || token.position === 0) continue;
      if (token.position > 50) continue; // in home column, can't be captured
      const resolved = resolvePosition(pi, token.position);
      if (resolved.onTrack === absolutePos) {
        token.position = 0; // send back to base
        pushLog(state, `${state.players[attackerIndex].name} captures ${state.players[pi].name}'s token!`);
        captured = true;
      }
    }
  }
  return captured;
}

export function sanitizeStateForPlayer(state, playerId) {
  // Ludo is a perfect-information game, so we return everything
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      tokens: player.tokens.map((t) => ({ ...t })),
    })),
  };
}

export function getBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player || player.hasWon) return null;

  if (state.subPhase === "roll_dice" && state.currentPlayerIndex === playerIndex) {
    return { type: "roll_dice", playerId: player.id };
  }

  if (state.subPhase === "move_token" && state.currentPlayerIndex === playerIndex) {
    const movable = state.movableTokens;
    if (movable.length === 0) return null;

    const dice = state.diceValue;

    // Bot strategy:
    // 1. Capture opponent if possible
    // 2. Move token closest to home
    // 3. Bring new token out on 6
    // 4. Prefer moving tokens that are already on the board

    let bestToken = movable[0];
    let bestScore = -Infinity;

    for (const ti of movable) {
      const token = player.tokens[ti];
      let score = 0;

      if (token.position === 0) {
        // Bringing out a new token
        score = 10;
      } else {
        const newPos = token.position + dice;

        // Reaching home is highest priority
        if (newPos >= 57) {
          score = 1000;
        } else if (newPos > 50) {
          // Moving into home column is good
          score = 500 + newPos;
        } else {
          // Prefer tokens closer to home
          score = token.position * 2;

          // Check for capture opportunity
          const resolved = resolvePosition(playerIndex, newPos);
          if (resolved.onTrack !== undefined && !SAFE_SPOTS.includes(resolved.onTrack)) {
            for (let pi = 0; pi < state.players.length; pi++) {
              if (pi === playerIndex) continue;
              for (const ot of state.players[pi].tokens) {
                if (ot.finished || ot.position === 0 || ot.position > 50) continue;
                const otherResolved = resolvePosition(pi, ot.position);
                if (otherResolved.onTrack === resolved.onTrack) {
                  score += 200; // capture bonus
                }
              }
            }
          }

          // Prefer moving to safe spots
          if (resolved.onTrack !== undefined && SAFE_SPOTS.includes(resolved.onTrack)) {
            score += 30;
          }

          // Avoid leaving safe spots with vulnerable tokens
          const currentResolved = resolvePosition(playerIndex, token.position);
          if (currentResolved.onTrack !== undefined && SAFE_SPOTS.includes(currentResolved.onTrack)) {
            score -= 15;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestToken = ti;
      }
    }

    return { type: "move_token", playerId: player.id, tokenIndex: bestToken };
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

// Export helpers for the app to use
export {
  PLAYER_COLORS,
  PLAYER_START,
  PLAYER_HOME_ENTRY,
  SAFE_SPOTS,
  BOARD_SIZE,
  HOME_COLUMN_LENGTH,
  TOKENS_PER_PLAYER,
  resolvePosition,
  getMovableTokens,
};
