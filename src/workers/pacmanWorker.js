const MOVES = [
  { dr: -1, dc: 0, direction: "up" },
  { dr: 1, dc: 0, direction: "down" },
  { dr: 0, dc: -1, direction: "left" },
  { dr: 0, dc: 1, direction: "right" },
];

const isSameCell = (a, b) => a.row === b.row && a.col === b.col;

const getValidMoves = (row, col, board) =>
  MOVES.map((move) => ({
    row: row + move.dr,
    col: col + move.dc,
    direction: move.direction,
  })).filter(
    (move) =>
      move.row >= 0 &&
      move.row < board.length &&
      move.col >= 0 &&
      move.col < board[0].length &&
      board[move.row][move.col] !== 1,
  );

const getNextGhostState = (ghost, player, board) => {
  const validMoves = getValidMoves(ghost.row, ghost.col, board);
  if (validMoves.length === 0) return ghost;

  if (ghost.behavior === "chase") {
    const bestMove = validMoves.reduce((best, move) => {
      const moveDistance =
        Math.abs(move.row - player.row) + Math.abs(move.col - player.col);
      const bestDistance =
        Math.abs(best.row - player.row) + Math.abs(best.col - player.col);
      return moveDistance < bestDistance ? move : best;
    });

    return { ...ghost, row: bestMove.row, col: bestMove.col };
  }

  const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
  return { ...ghost, row: randomMove.row, col: randomMove.col };
};

self.onmessage = (event) => {
  const { type, requestId, ghosts, player, grid } = event.data || {};

  if (type !== "MOVE_GHOSTS") {
    self.postMessage({
      type: "PACMAN_WORKER_ERROR",
      requestId,
      message: `Unknown Pac-Man worker message: ${type}`,
    });
    return;
  }

  try {
    const movedGhosts = ghosts.map((ghost) =>
      getNextGhostState(ghost, player, grid),
    );

    self.postMessage({
      type: "GHOSTS_MOVED",
      requestId,
      ghosts: movedGhosts,
      collided: movedGhosts.some((ghost) => isSameCell(ghost, player)),
    });
  } catch (error) {
    self.postMessage({
      type: "PACMAN_WORKER_ERROR",
      requestId,
      message: error instanceof Error ? error.message : "Pac-Man worker failed.",
    });
  }
};
