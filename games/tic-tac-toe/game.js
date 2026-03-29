// Tic-Tac-Toe — Pure Game Engine (Classic 3x3 + Super 9x9)
// ES module exports following Game Arena architecture

function pushLog(state, message) {
  state.log = state.log || [];
  state.log.unshift(message);
  if (state.log.length > 50) {
    state.log.length = 50;
  }
}

function createEmptyBoard() {
  return [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
}

function createSuperBoard() {
  // 3x3 grid of 3x3 boards
  const boards = [];
  for (let r = 0; r < 3; r++) {
    boards[r] = [];
    for (let c = 0; c < 3; c++) {
      boards[r][c] = createEmptyBoard();
    }
  }
  return boards;
}

// Check if a 3x3 board has a winner. Returns "X", "O", "draw", or null.
function checkSmallBoard(board) {
  const lines = [
    // rows
    [[0,0],[0,1],[0,2]],
    [[1,0],[1,1],[1,2]],
    [[2,0],[2,1],[2,2]],
    // cols
    [[0,0],[1,0],[2,0]],
    [[0,1],[1,1],[2,1]],
    [[0,2],[1,2],[2,2]],
    // diagonals
    [[0,0],[1,1],[2,2]],
    [[0,2],[1,1],[2,0]],
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    const va = board[a[0]][a[1]];
    const vb = board[b[0]][b[1]];
    const vc = board[c[0]][c[1]];
    if (va && va === vb && vb === vc) {
      return { winner: va, line };
    }
  }

  // Check draw
  let full = true;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (!board[r][c]) { full = false; break; }
    }
    if (!full) break;
  }
  if (full) return { winner: "draw", line: null };

  return null;
}

// For super mode: check the meta-board (3x3 of winners)
function checkMetaBoard(metaBoard) {
  return checkSmallBoard(metaBoard);
}

export function createGame({ players, options = {} }) {
  const variant = options.variant || "classic";
  const marks = ["X", "O"];

  const gamePlayers = players.map((player, i) => ({
    id: player.id,
    name: player.name,
    isBot: Boolean(player.isBot),
    mark: marks[i] || marks[0],
  }));

  const state = {
    players: gamePlayers,
    currentPlayerIndex: 0,
    phase: "playing",
    winnerId: null,
    winningLine: null, // for classic: [{row,col},...], for super: {meta:[{row,col},...], small:{bigRow,bigCol,line}}
    variant,
    log: [],
    options,
  };

  if (variant === "super") {
    state.boards = createSuperBoard();
    state.metaBoard = createEmptyBoard(); // tracks winner of each small board: "X", "O", "draw", or null
    state.nextBig = null; // {row, col} or null (any board)
    pushLog(state, `Super Tic-Tac-Toe begins! ${gamePlayers[0].name} (X) goes first.`);
  } else {
    state.board = createEmptyBoard();
    pushLog(state, `Tic-Tac-Toe begins! ${gamePlayers[0].name} (X) goes first.`);
  }

  return state;
}

export function applyAction(state, action) {
  if (!state) return { state, error: "Game not started." };
  if (state.phase === "finished") return { state, error: "Game finished." };

  const { type, playerId } = action;
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex < 0) return { state, error: "Unknown player." };

  if (type !== "place_mark") return { state, error: "Unknown action." };

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return { state, error: "Not your turn." };

  const mark = currentPlayer.mark;

  if (state.variant === "super") {
    return applySuperAction(state, action, playerIndex, mark);
  } else {
    return applyClassicAction(state, action, playerIndex, mark);
  }
}

function applyClassicAction(state, action, playerIndex, mark) {
  const { row, col } = action;
  if (row < 0 || row > 2 || col < 0 || col > 2) {
    return { state, error: "Invalid position." };
  }
  if (state.board[row][col] !== null) {
    return { state, error: "Cell already occupied." };
  }

  state.board[row][col] = mark;
  const player = state.players[playerIndex];
  pushLog(state, `${player.name} (${mark}) plays at row ${row + 1}, col ${col + 1}.`);

  const result = checkSmallBoard(state.board);
  if (result) {
    if (result.winner === "draw") {
      state.phase = "finished";
      state.winnerId = null;
      state.isDraw = true;
      pushLog(state, "It's a draw!");
    } else {
      state.phase = "finished";
      state.winnerId = player.id;
      state.winningLine = result.line.map(([r, c]) => ({ row: r, col: c }));
      pushLog(state, `${player.name} (${mark}) wins!`);
    }
  } else {
    // Next player
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    const next = state.players[state.currentPlayerIndex];
    pushLog(state, `${next.name} (${next.mark})'s turn.`);
  }

  return { state };
}

function applySuperAction(state, action, playerIndex, mark) {
  const { bigRow, bigCol, row, col } = action;

  if (bigRow < 0 || bigRow > 2 || bigCol < 0 || bigCol > 2) {
    return { state, error: "Invalid big board position." };
  }
  if (row < 0 || row > 2 || col < 0 || col > 2) {
    return { state, error: "Invalid cell position." };
  }

  // Check if player must play in a specific big board
  if (state.nextBig) {
    if (bigRow !== state.nextBig.row || bigCol !== state.nextBig.col) {
      return { state, error: `You must play in board (${state.nextBig.row + 1}, ${state.nextBig.col + 1}).` };
    }
  }

  // Check the small board isn't already won
  if (state.metaBoard[bigRow][bigCol] !== null) {
    return { state, error: "That board is already decided." };
  }

  // Check cell is empty
  if (state.boards[bigRow][bigCol][row][col] !== null) {
    return { state, error: "Cell already occupied." };
  }

  state.boards[bigRow][bigCol][row][col] = mark;
  const player = state.players[playerIndex];
  pushLog(state, `${player.name} (${mark}) plays in board (${bigRow + 1},${bigCol + 1}) at (${row + 1},${col + 1}).`);

  // Check if this small board is now won
  const smallResult = checkSmallBoard(state.boards[bigRow][bigCol]);
  if (smallResult && state.metaBoard[bigRow][bigCol] === null) {
    if (smallResult.winner === "draw") {
      state.metaBoard[bigRow][bigCol] = "draw";
      pushLog(state, `Board (${bigRow + 1},${bigCol + 1}) is a draw!`);
    } else {
      state.metaBoard[bigRow][bigCol] = smallResult.winner;
      pushLog(state, `${player.name} (${mark}) wins board (${bigRow + 1},${bigCol + 1})!`);
    }
  }

  // Check if the meta-board is won
  const metaResult = checkMetaBoard(state.metaBoard);
  if (metaResult) {
    if (metaResult.winner === "draw") {
      state.phase = "finished";
      state.winnerId = null;
      state.isDraw = true;
      pushLog(state, "The game is a draw!");
    } else {
      const winner = state.players.find((p) => p.mark === metaResult.winner);
      state.phase = "finished";
      state.winnerId = winner ? winner.id : null;
      state.winningLine = {
        meta: metaResult.line ? metaResult.line.map(([r, c]) => ({ row: r, col: c })) : null,
      };
      pushLog(state, `${winner ? winner.name : metaResult.winner} wins the game!`);
    }
  } else {
    // Determine next board: the cell position determines which big board
    if (state.metaBoard[row][col] === null) {
      state.nextBig = { row, col };
    } else {
      // That board is decided; player can go anywhere
      state.nextBig = null;
    }

    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    const next = state.players[state.currentPlayerIndex];
    if (state.nextBig) {
      pushLog(state, `${next.name} (${next.mark}) must play in board (${state.nextBig.row + 1},${state.nextBig.col + 1}).`);
    } else {
      pushLog(state, `${next.name} (${next.mark}) can play in any open board.`);
    }
  }

  return { state };
}

// ---- Bot AI ----

function getEmptyCells(board) {
  const cells = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (!board[r][c]) cells.push({ row: r, col: c });
    }
  }
  return cells;
}

function findWinningMove(board, mark) {
  const empty = getEmptyCells(board);
  for (const cell of empty) {
    board[cell.row][cell.col] = mark;
    const result = checkSmallBoard(board);
    board[cell.row][cell.col] = null;
    if (result && result.winner === mark) return cell;
  }
  return null;
}

function classicBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  const mark = player.mark;
  const oppMark = mark === "X" ? "O" : "X";
  const board = state.board;

  // 1. Win if possible
  const win = findWinningMove(board, mark);
  if (win) return { type: "place_mark", playerId: player.id, row: win.row, col: win.col };

  // 2. Block opponent
  const block = findWinningMove(board, oppMark);
  if (block) return { type: "place_mark", playerId: player.id, row: block.row, col: block.col };

  // 3. Center
  if (!board[1][1]) return { type: "place_mark", playerId: player.id, row: 1, col: 1 };

  // 4. Corners
  const corners = [[0,0],[0,2],[2,0],[2,2]];
  const openCorners = corners.filter(([r,c]) => !board[r][c]);
  if (openCorners.length > 0) {
    const [r, c] = openCorners[Math.floor(Math.random() * openCorners.length)];
    return { type: "place_mark", playerId: player.id, row: r, col: c };
  }

  // 5. Random
  const empty = getEmptyCells(board);
  if (empty.length > 0) {
    const cell = empty[Math.floor(Math.random() * empty.length)];
    return { type: "place_mark", playerId: player.id, row: cell.row, col: cell.col };
  }

  return null;
}

function superBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  const mark = player.mark;
  const oppMark = mark === "X" ? "O" : "X";

  // Get available big boards
  let bigBoards = [];
  if (state.nextBig) {
    bigBoards = [state.nextBig];
  } else {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (state.metaBoard[r][c] === null) bigBoards.push({ row: r, col: c });
      }
    }
  }

  if (bigBoards.length === 0) return null;

  // For each available big board, find best move
  // Priority: win a small board, block opponent from winning a small board, center, corner, random
  // Also try to avoid sending opponent to a board they'd win

  let bestMoves = [];

  for (const big of bigBoards) {
    const board = state.boards[big.row][big.col];
    const empty = getEmptyCells(board);

    for (const cell of empty) {
      let score = 0;

      // Check if this move wins the small board
      board[cell.row][cell.col] = mark;
      const result = checkSmallBoard(board);
      board[cell.row][cell.col] = null;

      if (result && result.winner === mark) {
        score += 100;

        // Check if winning this small board wins the game
        const tempMeta = state.metaBoard.map(row => [...row]);
        tempMeta[big.row][big.col] = mark;
        const metaResult = checkMetaBoard(tempMeta);
        if (metaResult && metaResult.winner === mark) {
          score += 1000; // Game-winning move!
        }
      }

      // Check if this blocks opponent from winning the small board
      board[cell.row][cell.col] = oppMark;
      const oppResult = checkSmallBoard(board);
      board[cell.row][cell.col] = null;
      if (oppResult && oppResult.winner === oppMark) {
        score += 50;
      }

      // Prefer center
      if (cell.row === 1 && cell.col === 1) score += 3;
      // Prefer corners
      if ((cell.row === 0 || cell.row === 2) && (cell.col === 0 || cell.col === 2)) score += 2;

      // Penalize sending opponent to a board where they can win a big board
      const nextBigRow = cell.row;
      const nextBigCol = cell.col;
      if (state.metaBoard[nextBigRow][nextBigCol] === null) {
        const nextBoard = state.boards[nextBigRow][nextBigCol];
        const oppWin = findWinningMove(nextBoard, oppMark);
        if (oppWin) score -= 20;
      }

      bestMoves.push({
        bigRow: big.row, bigCol: big.col,
        row: cell.row, col: cell.col,
        score,
      });
    }
  }

  if (bestMoves.length === 0) return null;

  // Pick best score (randomize among ties)
  bestMoves.sort((a, b) => b.score - a.score);
  const topScore = bestMoves[0].score;
  const topMoves = bestMoves.filter(m => m.score === topScore);
  const chosen = topMoves[Math.floor(Math.random() * topMoves.length)];

  return {
    type: "place_mark",
    playerId: player.id,
    bigRow: chosen.bigRow,
    bigCol: chosen.bigCol,
    row: chosen.row,
    col: chosen.col,
  };
}

export function getBotMove(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player) return null;
  if (state.phase !== "playing") return null;
  if (state.currentPlayerIndex !== playerIndex) return null;

  if (state.variant === "super") {
    return superBotMove(state, playerIndex);
  } else {
    return classicBotMove(state, playerIndex);
  }
}

export function sanitizeStateForPlayer(state, playerId) {
  // TTT is full information -- nothing to hide
  return { ...state };
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
