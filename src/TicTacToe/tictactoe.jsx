import { useEffect, useRef, useState } from "react";
import Navbar from "../Components/Navbar";
import GameBoot from "../Components/GameBoot";
import "../Components/GameBoot.css";
import "./tictactoe.css";
import { getBestAiMove, getWinner } from "./tictactoeAi";

function createInitialState() {
  return {
    mode: "ai",
    board: Array(9).fill(null),
    turn: "X",
    winner: null,
    draw: false,
    score: {
      X: 0,
      O: 0,
      draws: 0,
    },
  };
}

function applyMove(game, index) {
  if (index < 0 || index > 8 || game.board[index] || game.winner || game.draw) {
    return game;
  }

  const board = [...game.board];
  board[index] = game.turn;

  const winner = getWinner(board);
  const draw = !winner && board.every(Boolean);

  if (winner) {
    return {
      ...game,
      board,
      winner,
      draw: false,
      score: {
        ...game.score,
        [winner]: game.score[winner] + 1,
      },
    };
  }

  if (draw) {
    return {
      ...game,
      board,
      draw: true,
      score: {
        ...game.score,
        draws: game.score.draws + 1,
      },
    };
  }

  return {
    ...game,
    board,
    turn: game.turn === "X" ? "O" : "X",
  };
}

export default function TicTacToe() {
  const [booting, setBooting] = useState(true);
  const [game, setGame] = useState(createInitialState);
  const workerRef = useRef(null);
  const requestIdRef = useRef(0);
  const latestBoardRef = useRef("[]");

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/tictactoeWorker.js", import.meta.url),
      { type: "module" },
    );

    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { type, move, requestId, message } = event.data || {};

      if (requestId !== requestIdRef.current) return;

      if (type === "AI_MOVE_ERROR") {
        console.error(message);
        setGame((previous) => applyMove(previous, getBestAiMove(previous.board, "O", "X")));
        return;
      }

      if (type !== "AI_MOVE_RESULT") return;

      setGame((previous) => {
        if (
          previous.mode !== "ai" ||
          previous.turn !== "O" ||
          previous.winner ||
          previous.draw ||
          JSON.stringify(previous.board) !== latestBoardRef.current
        ) {
          return previous;
        }

        return applyMove(previous, move);
      });
    };

    worker.onerror = (error) => {
      console.error("Tic-Tac-Toe worker failed.", error);
      setGame((previous) => {
        if (previous.mode !== "ai" || previous.turn !== "O" || previous.winner || previous.draw) {
          return previous;
        }

        return applyMove(previous, getBestAiMove(previous.board, "O", "X"));
      });
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (booting) return undefined;
    if (game.mode !== "ai" || game.turn !== "O" || game.winner || game.draw) {
      return undefined;
    }

    const snapshot = JSON.stringify(game.board);
    const timer = setTimeout(() => {
      latestBoardRef.current = snapshot;
      requestIdRef.current += 1;

      try {
        if (!workerRef.current) {
          setGame((previous) => applyMove(previous, getBestAiMove(previous.board, "O", "X")));
          return;
        }

        workerRef.current.postMessage({
          type: "GET_AI_MOVE",
          requestId: requestIdRef.current,
          board: game.board,
        });
      } catch (error) {
        console.error("Unable to send Tic-Tac-Toe board to worker.", error);
        setGame((previous) => applyMove(previous, getBestAiMove(previous.board, "O", "X")));
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [booting, game]);

  const changeMode = (mode) => {
    setGame((previous) => ({
      ...previous,
      mode,
      board: Array(9).fill(null),
      turn: "X",
      winner: null,
      draw: false,
    }));
  };

  const restartRound = () => {
    setGame((previous) => ({
      ...previous,
      board: Array(9).fill(null),
      turn: "X",
      winner: null,
      draw: false,
    }));
  };

  const resetMatch = () => {
    setGame((previous) => ({
      ...previous,
      board: Array(9).fill(null),
      turn: "X",
      winner: null,
      draw: false,
      score: {
        X: 0,
        O: 0,
        draws: 0,
      },
    }));
  };

  const statusText = game.winner
    ? `${game.winner} wins this round`
    : game.draw
      ? "Draw"
      : `Turn: ${game.turn}`;

  if (booting) {
    return (
      <div className="ttt-page">
        <Navbar />
        <GameBoot title="Tic Tac Toe" subtitle="Loading board, rules, and AI strategy..." />
      </div>
    );
  }

  return (
    <div className="ttt-page">
      <Navbar />

      <div className="ttt-container">
        <header className="ttt-header">
          <h1>Tic Tac Toe</h1>
          <div className="ttt-mode-switch">
            <button
              className={game.mode === "ai" ? "active" : ""}
              onClick={() => changeMode("ai")}
            >
              Player vs AI
            </button>
            <button
              className={game.mode === "pvp" ? "active" : ""}
              onClick={() => changeMode("pvp")}
            >
              Player vs Player
            </button>
          </div>
        </header>

        <div className="ttt-scorebar">
          <span>X: {game.score.X}</span>
          <span>O: {game.score.O}</span>
          <span>Draws: {game.score.draws}</span>
        </div>

        <p className="ttt-status">{statusText}</p>

        <div className="ttt-grid" role="grid" aria-label="Tic Tac Toe board">
          {game.board.map((cell, index) => (
            <button
              key={index}
              className="ttt-cell"
              onClick={() => setGame((previous) => applyMove(previous, index))}
              disabled={Boolean(cell) || Boolean(game.winner) || game.draw}
            >
              {cell || ""}
            </button>
          ))}
        </div>

        <div className="ttt-actions">
          <button onClick={restartRound}>Restart Round</button>
          <button onClick={resetMatch}>Reset Match</button>
        </div>
      </div>
    </div>
  );
}
