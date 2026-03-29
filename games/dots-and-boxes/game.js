// Dots and Boxes — Pure Game Engine
// Players draw lines between adjacent dots on a grid.
// Completing the 4th side of a box claims it. Completing a box grants another turn.
// The player with the most boxes wins.

function pushLog(state, message) {
  state.log = state.log || [];
  state.log.unshift(message);
  if (state.log.length > 50) {
    state.log.length = 50;
  }
}

// Lines are stored as strings: "h:row:col" for horizontal, "v:row:col" for vertical.
// Horizontal line "h:r:c" connects dot (r,c) to dot (r,c+1).
// Vertical line "v:r:c" connects dot (r,c) to dot (r+1,c).

function lineKey(orientation, row, col) {
  return `${orientation}:${row}:${col}`;
}

function getAllLines(rows, cols) {
  const lines = [];
  // Horizontal lines: rows+1 rows of dots, cols horizontal segments each
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      lines.push(lineKey("h", r, c));
    }
  }
  // Vertical lines: rows vertical segments, cols+1 columns each
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols; c++) {
      lines.push(lineKey("v", r, c));
    }
  }
  return lines;
}

function getBoxesCompletedByLine(line, rows, cols) {
  const parts = line.split(":");
  const orientation = parts[0];
  const r = parseInt(parts[1], 10);
  const c = parseInt(parts[2], 10);
  const boxes = [];

  if (orientation === "h") {
    // Horizontal line at row r, col c
    // Could complete box above (row r-1, col c) and box below (row r, col c)
    if (r > 0) boxes.push({ row: r - 1, col: c });
    if (r < rows) boxes.push({ row: r, col: c });
  } else {
    // Vertical line at row r, col c
    // Could complete box to the left (row r, col c-1) and box to the right (row r, col c)
    if (c > 0) boxes.push({ row: r, col: c - 1 });
    if (c < cols) boxes.push({ row: r, col: c });
  }

  return boxes;
}

function isBoxComplete(boxRow, boxCol, drawnLines) {
  const top = lineKey("h", boxRow, boxCol);
  const bottom = lineKey("h", boxRow + 1, boxCol);
  const left = lineKey("v", boxRow, boxCol);
  const right = lineKey("v", boxRow, boxCol + 1);
  return drawnLines.has(top) && drawnLines.has(bottom) && drawnLines.has(left) && drawnLines.has(right);
}

function countBoxSides(boxRow, boxCol, drawnLines) {
  let count = 0;
  if (drawnLines.has(lineKey("h", boxRow, boxCol))) count++;
  if (drawnLines.has(lineKey("h", boxRow + 1, boxCol))) count++;
  if (drawnLines.has(lineKey("v", boxRow, boxCol))) count++;
  if (drawnLines.has(lineKey("v", boxRow, boxCol + 1))) count++;
  return count;
}

export function createGame({ players, options = {} }) {
  const gridRows = options.gridRows || 4;
  const gridCols = options.gridCols || 4;

  const gamePlayers = players.map((player) => ({
    id: player.id,
    name: player.name,
    isBot: Boolean(player.isBot),
    score: 0,
    color: null,
  }));

  // Assign player colors
  const playerColors = ["#0a84ff", "#ff453a", "#30d158", "#ffd60a"];
  gamePlayers.forEach((p, i) => {
    p.color = playerColors[i % playerColors.length];
  });

  const state = {
    players: gamePlayers,
    currentPlayerIndex: 0,
    phase: "playing", // playing | finished
    winnerId: null,
    gridRows,
    gridCols,
    drawnLines: {},    // { lineKey: playerIndex }
    boxes: {},         // { "row:col": playerIndex }
    totalBoxes: gridRows * gridCols,
    claimedBoxes: 0,
    log: [],
    options,
  };

  pushLog(state, `Game begins! ${gamePlayers[0].name} goes first.`);
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

  if (type === "draw_line") {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return { state, error: "Not your turn." };
    }

    const { line } = action;
    if (!line) {
      return { state, error: "No line specified." };
    }

    // Validate line format
    const parts = line.split(":");
    if (parts.length !== 3) {
      return { state, error: "Invalid line format." };
    }
    const orientation = parts[0];
    const r = parseInt(parts[1], 10);
    const c = parseInt(parts[2], 10);

    if (orientation !== "h" && orientation !== "v") {
      return { state, error: "Invalid line orientation." };
    }

    // Validate bounds
    if (orientation === "h") {
      if (r < 0 || r > state.gridRows || c < 0 || c >= state.gridCols) {
        return { state, error: "Line out of bounds." };
      }
    } else {
      if (r < 0 || r >= state.gridRows || c < 0 || c > state.gridCols) {
        return { state, error: "Line out of bounds." };
      }
    }

    // Check if already drawn
    if (state.drawnLines[line] !== undefined) {
      return { state, error: "Line already drawn." };
    }

    // Draw the line
    state.drawnLines[line] = playerIndex;

    // Check for completed boxes
    const drawnSet = new Set(Object.keys(state.drawnLines));
    const potentialBoxes = getBoxesCompletedByLine(line, state.gridRows, state.gridCols);
    let boxesCompleted = 0;

    for (const box of potentialBoxes) {
      const boxKey = `${box.row}:${box.col}`;
      if (state.boxes[boxKey] === undefined && isBoxComplete(box.row, box.col, drawnSet)) {
        state.boxes[boxKey] = playerIndex;
        state.claimedBoxes++;
        boxesCompleted++;
        currentPlayer.score++;
      }
    }

    if (boxesCompleted > 0) {
      pushLog(state, `${currentPlayer.name} completed ${boxesCompleted} box${boxesCompleted > 1 ? "es" : ""}! (Score: ${currentPlayer.score})`);
    } else {
      pushLog(state, `${currentPlayer.name} drew a line.`);
    }

    // Check if game is over
    if (state.claimedBoxes >= state.totalBoxes) {
      state.phase = "finished";
      let best = state.players[0];
      for (const p of state.players) {
        if (p.score > best.score) best = p;
      }
      const tied = state.players.filter((p) => p.score === best.score);
      if (tied.length > 1) {
        state.winnerId = null; // draw
        const names = tied.map((p) => p.name).join(" & ");
        pushLog(state, `Game over! It's a draw between ${names} with ${best.score} boxes each!`);
      } else {
        state.winnerId = best.id;
        pushLog(state, `Game over! ${best.name} wins with ${best.score} boxes!`);
      }
      return { state };
    }

    // If no box was completed, move to next player
    if (boxesCompleted === 0) {
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      pushLog(state, `${state.players[state.currentPlayerIndex].name}'s turn.`);
    } else {
      pushLog(state, `${currentPlayer.name} gets another turn!`);
    }

    return { state };
  }

  return { state, error: "Unknown action." };
}

export function sanitizeStateForPlayer(state, playerId) {
  // Dots and boxes is a perfect information game — no hidden state
  return { ...state };
}

export function getBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player) return null;
  if (state.phase !== "playing") return null;
  if (state.currentPlayerIndex !== playerIndex) return null;

  const drawnSet = new Set(Object.keys(state.drawnLines));
  const allLines = getAllLines(state.gridRows, state.gridCols);
  const available = allLines.filter((l) => !drawnSet.has(l));

  if (available.length === 0) return null;

  // Strategy:
  // 1. If any line completes a box, take it.
  // 2. Avoid lines that give opponent a box (lines that create a 3-sided box).
  // 3. Otherwise pick randomly from safe lines.

  // Phase 1: Find lines that complete boxes
  const completing = [];
  const safe = [];
  const dangerous = [];

  for (const line of available) {
    const testSet = new Set(drawnSet);
    testSet.add(line);

    const potentialBoxes = getBoxesCompletedByLine(line, state.gridRows, state.gridCols);
    let completesBox = false;

    for (const box of potentialBoxes) {
      if (isBoxComplete(box.row, box.col, testSet)) {
        completesBox = true;
      }
    }

    if (completesBox) {
      completing.push(line);
      continue;
    }

    // Check if this line makes any adjacent box have 3 sides (giving opponent opportunity)
    let givesFreeBox = false;
    for (const box of potentialBoxes) {
      const boxKey = `${box.row}:${box.col}`;
      if (state.boxes[boxKey] !== undefined) continue;
      const sides = countBoxSides(box.row, box.col, testSet);
      if (sides === 3) {
        givesFreeBox = true;
        break;
      }
    }

    if (givesFreeBox) {
      dangerous.push(line);
    } else {
      safe.push(line);
    }
  }

  // 1. Complete boxes first (greedy — chain completions)
  if (completing.length > 0) {
    return { type: "draw_line", playerId: player.id, line: completing[0] };
  }

  // 2. Pick a safe line
  if (safe.length > 0) {
    const pick = safe[Math.floor(Math.random() * safe.length)];
    return { type: "draw_line", playerId: player.id, line: pick };
  }

  // 3. All moves are dangerous — pick the one that gives away the fewest boxes
  // (prefer opening a short chain)
  if (dangerous.length > 0) {
    // Find the line that gives away the fewest boxes in the resulting chain
    let bestLine = dangerous[0];
    let bestChainLength = Infinity;

    for (const line of dangerous) {
      const chainLength = estimateChainLength(line, state);
      if (chainLength < bestChainLength) {
        bestChainLength = chainLength;
        bestLine = line;
      }
    }

    return { type: "draw_line", playerId: player.id, line: bestLine };
  }

  return null;
}

function estimateChainLength(line, state) {
  // Simulate drawing this line and count how many boxes would be in the resulting chain
  const drawnSet = new Set(Object.keys(state.drawnLines));
  drawnSet.add(line);

  let chain = 0;
  let changed = true;

  while (changed) {
    changed = false;
    for (let r = 0; r < state.gridRows; r++) {
      for (let c = 0; c < state.gridCols; c++) {
        const boxKey = `${r}:${c}`;
        if (state.boxes[boxKey] !== undefined) continue;
        if (isBoxComplete(r, c, drawnSet)) continue;
        const sides = countBoxSides(r, c, drawnSet);
        if (sides === 3) {
          // This box will be taken, and then adjacent boxes might also become completable
          // Find the missing line and add it
          const missing = getMissingLine(r, c, drawnSet);
          if (missing) {
            drawnSet.add(missing);
            chain++;
            changed = true;
          }
        }
      }
    }
  }

  return chain;
}

function getMissingLine(boxRow, boxCol, drawnSet) {
  const sides = [
    lineKey("h", boxRow, boxCol),
    lineKey("h", boxRow + 1, boxCol),
    lineKey("v", boxRow, boxCol),
    lineKey("v", boxRow, boxCol + 1),
  ];
  for (const s of sides) {
    if (!drawnSet.has(s)) return s;
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
