import { getBestAiMove } from "../TicTacToe/tictactoeAi";

function isValidBoard(board) {
  return (
    Array.isArray(board) &&
    board.length === 9 &&
    board.every((cell) => cell === null || cell === "X" || cell === "O")
  );
}

self.onmessage = (event) => {
  const { type, board, requestId } = event.data || {};

  if (type !== "GET_AI_MOVE") {
    self.postMessage({
      type: "AI_MOVE_ERROR",
      requestId,
      message: `Unknown Tic-Tac-Toe worker message: ${type}`,
    });
    return;
  }

  if (!isValidBoard(board)) {
    self.postMessage({
      type: "AI_MOVE_ERROR",
      requestId,
      message: "Worker received an invalid Tic-Tac-Toe board.",
    });
    return;
  }

  const move = getBestAiMove(board, "O", "X");

  self.postMessage({
    type: "AI_MOVE_RESULT",
    requestId,
    move,
  });
};
