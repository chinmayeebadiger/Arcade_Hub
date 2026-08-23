import { useEffect, useRef, useState } from "react";
import "./shooter.css";
import Navbar from "../Components/Navbar";
import GameBoot from "../Components/GameBoot";
import { useAuth } from "../context/AuthContext";

export default function Shooter() {
  const gameWidth = 600;
  const gameHeight = 400;

  const [gameState, setGameState] = useState("idle");
  const [playerX, setPlayerX] = useState(280);
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [booting, setBooting] = useState(true);

  const keys = useRef({ left: false, right: false, shoot: false });
  const playerXRef = useRef(280);
  const lastShotRef = useRef(0);
  const bulletsRef = useRef([]);
  const enemiesRef = useRef([]);
  const workerRef = useRef(null);
  const requestIdRef = useRef(0);
  const workerBusyRef = useRef(false);

  const { user, reportScore } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/shooterWorker.js", import.meta.url),
      { type: "module" },
    );

    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { type, requestId, result, message } = event.data || {};
      if (requestId !== requestIdRef.current) return;
      workerBusyRef.current = false;

      if (type === "SHOOTER_WORKER_ERROR") {
        console.error(message);
        return;
      }

      if (type !== "SHOOTER_TICK_RESULT") return;

      playerXRef.current = result.playerX;
      bulletsRef.current = result.bullets;
      enemiesRef.current = result.enemies;
      lastShotRef.current = result.lastShot;

      setPlayerX(result.playerX);
      setBullets(result.bullets);
      setEnemies(result.enemies);

      if (result.hitCount > 0 && user) {
        reportScore("shooter", result.hitCount * 10).catch((error) => {
          console.error(error);
        });
      }

      if (result.gameOver) {
        setGameState("gameover");
      }
    };

    worker.onerror = (error) => {
      workerBusyRef.current = false;
      workerRef.current = null;
      console.error("Shooter worker failed.", error);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [reportScore, user]);

  useEffect(() => {
    if (booting) return undefined;

    const down = (e) => {
      if (e.key === "ArrowLeft") keys.current.left = true;
      if (e.key === "ArrowRight") keys.current.right = true;
      if (e.key === " " || e.key === "Space") {
        e.preventDefault();
        keys.current.shoot = true;
      }
    };
    const up = (e) => {
      if (e.key === "ArrowLeft") keys.current.left = false;
      if (e.key === "ArrowRight") keys.current.right = false;
      if (e.key === " " || e.key === "Space") {
        e.preventDefault();
        keys.current.shoot = false;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [booting]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const runLocalTick = () => {
      setPlayerX((prev) => {
        let x = prev;
        if (keys.current.left) x -= 5;
        if (keys.current.right) x += 5;
        const clamped = Math.max(0, Math.min(x, gameWidth - 40));
        playerXRef.current = clamped;
        return clamped;
      });

      const now = Date.now();
      if (keys.current.shoot && now - lastShotRef.current > 250) {
        lastShotRef.current = now;
        bulletsRef.current.push({
          x: playerXRef.current + 18,
          y: gameHeight - 40,
        });
      }

      bulletsRef.current = bulletsRef.current
        .map((bullet) => ({ ...bullet, y: bullet.y - 6 }))
        .filter((bullet) => bullet.y > 0);

      if (Math.random() < 0.02) {
        enemiesRef.current.push({ x: Math.random() * (gameWidth - 30), y: 0 });
      }

      enemiesRef.current = enemiesRef.current.map((enemy) => ({
        ...enemy,
        y: enemy.y + 1,
      }));

      const remainingEnemies = [];
      let hitCount = 0;

      for (let enemyIndex = 0; enemyIndex < enemiesRef.current.length; enemyIndex += 1) {
        const enemy = enemiesRef.current[enemyIndex];
        let hit = false;
        bulletsRef.current = bulletsRef.current.filter((bullet) => {
          if (
            !hit &&
            bullet.x < enemy.x + 30 &&
            bullet.x + 4 > enemy.x &&
            bullet.y < enemy.y + 30 &&
            bullet.y + 10 > enemy.y
          ) {
            hit = true;
            return false;
          }
          return true;
        });

        if (hit) {
          hitCount += 1;
        } else {
          remainingEnemies.push(enemy);
        }
      }

      enemiesRef.current = remainingEnemies;

      if (hitCount > 0 && user) {
        reportScore("shooter", hitCount * 10).catch((error) => {
          console.error(error);
        });
      }

      if (enemiesRef.current.some((enemy) => enemy.y > gameHeight - 40)) {
        setGameState("gameover");
      }

      setBullets([...bulletsRef.current]);
      setEnemies([...enemiesRef.current]);
    };

    const interval = setInterval(() => {
      if (!workerRef.current) {
        runLocalTick();
        return;
      }

      if (workerBusyRef.current) {
        return;
      }

      workerBusyRef.current = true;
      requestIdRef.current += 1;

      try {
        workerRef.current.postMessage({
          type: "SHOOTER_TICK",
          requestId: requestIdRef.current,
          payload: {
            playerX: playerXRef.current,
            bullets: bulletsRef.current,
            enemies: enemiesRef.current,
            keys: keys.current,
            now: Date.now(),
            lastShot: lastShotRef.current,
            spawnRoll: Math.random(),
            spawnX: Math.random(),
          },
        });
      } catch (error) {
        workerBusyRef.current = false;
        console.error("Unable to send Shooter state to worker.", error);
        runLocalTick();
      }
    }, 16);

    return () => clearInterval(interval);
  }, [gameHeight, gameState, gameWidth, reportScore, user]);

  const startGame = () => {
    requestIdRef.current += 1;
    workerBusyRef.current = false;
    setPlayerX(280);
    playerXRef.current = 280;
    bulletsRef.current = [];
    enemiesRef.current = [];
    setBullets([]);
    setEnemies([]);
    setGameState("playing");
  };

  if (booting) {
    return (
      <div className="page">
        <Navbar />
        <GameBoot
          title="Shooter"
          subtitle="Loading Enemies, Bullets, and Shooting Pad..."
        />
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <div className="game">
        <div
          className="player"
          style={{ left: playerX, top: gameHeight - 30 }}
        />

        {bullets.map((b, i) => (
          <div key={i} className="bullet" style={{ left: b.x, top: b.y }} />
        ))}

        {enemies.map((e, i) => (
          <div key={i} className="enemy" style={{ left: e.x, top: e.y }} />
        ))}

        {gameState === "idle" && (
          <div className="button-div">
            <button className="start-button" onClick={startGame}>
              Start
            </button>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="button-div">
            <h2>Game Over</h2>
            <button className="start-button" onClick={startGame}>
              Replay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
