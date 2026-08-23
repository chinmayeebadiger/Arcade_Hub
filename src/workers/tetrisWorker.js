const COLS = 10;
const ROWS = 20;

const PIECES = [
  { type: "I", color: "#61d8ff", shape: [[1, 1, 1, 1]] },
  { type: "J", color: "#6f8dff", shape: [[1, 0, 0], [1, 1, 1]] },
  { type: "L", color: "#ffb25c", shape: [[0, 0, 1], [1, 1, 1]] },
  { type: "O", color: "#ffe66d", shape: [[1, 1], [1, 1]] },
  { type: "S", color: "#7ef5a8", shape: [[0, 1, 1], [1, 1, 0]] },
  { type: "T", color: "#ca93ff", shape: [[0, 1, 0], [1, 1, 1]] },
  { type: "Z", color: "#ff8699", shape: [[1, 1, 0], [0, 1, 1]] },
];

function cloneShape(shape) {
  return shape.map((row) => [...row]);
}

function randomPiece() {
  const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
  return {
    type: piece.type,
    color: piece.color,
    shape: cloneShape(piece.shape),
    row: -1,
    col: Math.floor((COLS - piece.shape[0].length) / 2),
  };
}

function canPlace(board, piece, row, col, shape = piece.shape) {
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;

      const nextX = col + x;
      const nextY = row + y;

      if (nextX < 0 || nextX >= COLS || nextY >= ROWS) {
        return false;
      }

      if (nextY >= 0 && board[nextY][nextX]) {
        return false;
      }
    }
  }

  return true;
}

function rotateClockwise(shape) {
  return shape[0].map((_, index) =>
    shape.map((row) => row[index]).reverse(),
  );
}

function clearCompletedLines(board) {
  let cleared = 0;

  const filtered = board.filter((row) => {
    const full = row.every(Boolean);
    if (full) cleared += 1;
    return !full;
  });

  while (filtered.length < ROWS) {
    filtered.unshift(Array(COLS).fill(null));
  }

  return { board: filtered, cleared };
}

function lockPiece(game) {
  const mergedBoard = game.board.map((row) => [...row]);

  game.piece.shape.forEach((row, y) => {
    row.forEach((filled, x) => {
      if (!filled) return;
      const boardY = game.piece.row + y;
      const boardX = game.piece.col + x;
      if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
        mergedBoard[boardY][boardX] = game.piece.color;
      }
    });
  });

  const { board: nextBoard, cleared } = clearCompletedLines(mergedBoard);
  const totalLines = game.lines + cleared;
  const nextLevel = 1 + Math.floor(totalLines / 10);
  const lineScore = [0, 100, 300, 500, 800][cleared] || 0;

  const activePiece = {
    ...game.nextPiece,
    row: -1,
    col: Math.floor((COLS - game.nextPiece.shape[0].length) / 2),
  };

  const canSpawn = canPlace(nextBoard, activePiece, activePiece.row, activePiece.col);

  return {
    ...game,
    board: nextBoard,
    piece: activePiece,
    nextPiece: randomPiece(),
    score: game.score + lineScore * game.level,
    lines: totalLines,
    level: nextLevel,
    status: canSpawn ? "playing" : "gameover",
  };
}

function applyCommand(game, command) {
  if (game.status !== "playing") return game;

  if (command === "TICK" || command === "MOVE_DOWN") {
    if (canPlace(game.board, game.piece, game.piece.row + 1, game.piece.col)) {
      return {
        ...game,
        score: command === "MOVE_DOWN" ? game.score + 1 : game.score,
        piece: { ...game.piece, row: game.piece.row + 1 },
      };
    }

    return lockPiece(game);
  }

  if (command === "MOVE_LEFT" || command === "MOVE_RIGHT") {
    const offset = command === "MOVE_LEFT" ? -1 : 1;
    if (canPlace(game.board, game.piece, game.piece.row, game.piece.col + offset)) {
      return {
        ...game,
        piece: { ...game.piece, col: game.piece.col + offset },
      };
    }
    return game;
  }

  if (command === "ROTATE") {
    const rotated = rotateClockwise(game.piece.shape);
    const kicks = [0, -1, 1, -2, 2];

    for (let index = 0; index < kicks.length; index += 1) {
      const offset = kicks[index];
      if (canPlace(game.board, game.piece, game.piece.row, game.piece.col + offset, rotated)) {
        return {
          ...game,
          piece: {
            ...game.piece,
            shape: rotated,
            col: game.piece.col + offset,
          },
        };
      }
    }

    return game;
  }

  if (command === "HARD_DROP") {
    let dropped = game;
    while (canPlace(dropped.board, dropped.piece, dropped.piece.row + 1, dropped.piece.col)) {
      dropped = {
        ...dropped,
        score: dropped.score + 2,
        piece: { ...dropped.piece, row: dropped.piece.row + 1 },
      };
    }
    return lockPiece(dropped);
  }

  return game;
}

self.onmessage = (event) => {
  const { type, requestId, game, command } = event.data || {};

  if (type !== "APPLY_TETRIS_COMMAND") {
    self.postMessage({
      type: "TETRIS_WORKER_ERROR",
      requestId,
      message: `Unknown Tetris worker message: ${type}`,
    });
    return;
  }

  try {
    self.postMessage({
      type: "TETRIS_COMMAND_RESULT",
      requestId,
      game: applyCommand(game, command),
    });
  } catch (error) {
    self.postMessage({
      type: "TETRIS_WORKER_ERROR",
      requestId,
      message: error instanceof Error ? error.message : "Tetris worker failed.",
    });
  }
};
