import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ArcadeMachine from "../Components/ArcadeMachine";
import { useState } from "react";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openArcade, setOpenArcade] = useState(false);

  const games = [
    {
      title: "Minesweeper",
      path: "/minesweeper",
      image: "/images/minesweeper.png",
      description: "Logic • Deduction • Classic",
    },
    {
      title: "Pac-Man",
      path: "/pacman",
      image: "/images/pacman.png",
      description: "Arcade • Navigation • Reflex",
    },
    {
      title: "Snake",
      path: "/snake",
      image: "/images/snake.png",
      description: "Reflex • Planning • Classic",
    },
    {
      title: "Brick Breaker",
      path: "/brick-breaker",
      image: "/images/brickbreaker.png",
      description: "Paddle • Physics • Arcade",
    },
    {
      title: "Pong",
      path: "/pong",
      image: "/images/pong.png",
      description: "Arcade • Duel • Precision",
    },
    {
      title: "Tic-Tac-Toe",
      path: "/tictactoe",
      image: "/images/tictactoe.png",
      description: "Strategy • PvP/AI • Classic",
    },
    {
      title: "Tetris",
      path: "/tetris",
      image: "/images/tetris.png",
      description: "Blocks • Rotation • Puzzle",
    },
    {
      title: "Shooter",
      path: "/shooter",
      thumb: "SH",
      description: "Accuracy • Shooting • Speed",
    },
  ];

  return (
    <div className="dashboard">
      <div className="ambient-3d" aria-hidden="true">
        <span className="float-shape orb orb-a" />
        <span className="float-shape orb orb-b" />
        <span className="float-shape panel panel-a" />
        <span className="float-shape panel panel-b" />
      </div>

      {/* LEFT ARROW */}
      <div className="arcade-toggle" onClick={() => setOpenArcade(true)}>
        ▶
      </div>

      {/* POPUP */}
      {openArcade && (
        <div className="arcade-overlay">
          <div className="arcade-popup">
            <button className="close-btn" onClick={() => setOpenArcade(false)}>
              ✖
            </button>

            <ArcadeMachine games={games} />
          </div>
        </div>
      )}
      {/* ── Top actions ── */}
      <div className="top-actions">
        <button
          className="friends-btn"
          onClick={() => (user ? navigate("/friends") : navigate("/login"))}
        >
          Friends
        </button>

        {user ? (
          <div className="user-section">
            <span className="username">Hello, {user.email.split("@")[0]}</span>
            <button
              className="profile-btn"
              onClick={() => navigate("/profile")}
            >
              Profile
            </button>
          </div>
        ) : (
          <button className="login-btn" onClick={() => navigate("/login")}>
            Login
          </button>
        )}
      </div>

      {/* ── Header ── */}
      <header>
        <div className="dashboard-header">
          <h1 className="dashboard-title">Arcade Hub</h1>
          <p>A collection of simple, relaxing mini games</p>
        </div>
      </header>

      {/* ── Game grid ── */}
      <section className="games-section">
        <div className="game-grid">
          {games.map((game) => (
            <Link to={game.path} key={game.path} className="game-card">
              {game.image ? (
                <img src={game.image} alt={game.title} />
              ) : (
                <div className="game-thumb">{game.thumb}</div>
              )}
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              <span className="play-cta">Play</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
