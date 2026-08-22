const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function getWinner(board) {
  for (let index = 0; index < WIN_LINES.length; index += 1) {
    const [a, b, c] = WIN_LINES[index];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function getAvailableMoves(board) {
  return board
    .map((value, index) => (value ? null : index))
    .filter((value) => value !== null);
}

function minimax(board, aiSymbol, humanSymbol, isAiTurn) {
  const winner = getWinner(board);

  if (winner === aiSymbol) return 10;
  if (winner === humanSymbol) return -10;

  const availableMoves = getAvailableMoves(board);
  if (!availableMoves.length) return 0;

  if (isAiTurn) {
    let best = -Infinity;
    for (let i = 0; i < availableMoves.length; i += 1) {
      const move = availableMoves[i];
      const copy = [...board];
      copy[move] = aiSymbol;
      best = Math.max(best, minimax(copy, aiSymbol, humanSymbol, false));
    }
    return best;
  }

  let best = Infinity;
  for (let i = 0; i < availableMoves.length; i += 1) {
    const move = availableMoves[i];
    const copy = [...board];
    copy[move] = humanSymbol;
    best = Math.min(best, minimax(copy, aiSymbol, humanSymbol, true));
  }
  return best;
}

export function getBestAiMove(board, aiSymbol = "O", humanSymbol = "X") {
  const availableMoves = getAvailableMoves(board);
  let bestScore = -Infinity;
  let bestMove = availableMoves[0] ?? -1;

  for (let i = 0; i < availableMoves.length; i += 1) {
    const move = availableMoves[i];
    const copy = [...board];
    copy[move] = aiSymbol;
    const score = minimax(copy, aiSymbol, humanSymbol, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
