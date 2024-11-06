"use client";

import React, { useEffect, useState } from "react";
import { useGameState } from "../hook/useGameState";
import MazeBoard from "./MazeBoard";

const Game: React.FC = () => {
  const {
    maze,
    playerPosition,
    watcherPositions,
    mines,
    gameStatus,
    score,
    movePlayer,
    placeMine,
    restartGame,
  } = useGameState();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          movePlayer(0, -1);
          break;
        case "ArrowDown":
          movePlayer(0, 1);
          break;
        case "ArrowLeft":
          movePlayer(-1, 0);
          break;
        case "ArrowRight":
          movePlayer(1, 0);
          break;
        case " ":
          placeMine();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    setIsTouchDevice("ontouchstart" in window);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer, placeMine]);

  const handleTouchMove = (direction: "up" | "down" | "left" | "right") => {
    switch (direction) {
      case "up":
        movePlayer(0, -1);
        break;
      case "down":
        movePlayer(0, 1);
        break;
      case "left":
        movePlayer(-1, 0);
        break;
      case "right":
        movePlayer(1, 0);
        break;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Maze</h1>
      <div className="bg-white p-4 rounded shadow-lg">
        <MazeBoard
          maze={maze}
          playerPosition={playerPosition}
          watcherPositions={watcherPositions}
          mines={mines}
        />
      </div>
      <div className="mt-4 text-xl">スコア: {score}</div>
      {gameStatus !== "playing" && (
        <div className="mt-4 text-2xl font-bold">
          {gameStatus === "gameover" ? "ゲームオーバー" : "クリア！"}
        </div>
      )}
      {gameStatus !== "playing" && (
        <button
          onClick={restartGame}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          ゲーム再スタート
        </button>
      )}
      {isTouchDevice && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => handleTouchMove("up")}
            className="p-2 bg-blue-500 text-white rounded"
          >
            ↑
          </button>
          <button
            onClick={() => handleTouchMove("left")}
            className="p-2 bg-blue-500 text-white rounded"
          >
            ←
          </button>
          <button
            onClick={() => handleTouchMove("right")}
            className="p-2 bg-blue-500 text-white rounded"
          >
            →
          </button>
          <button
            onClick={() => handleTouchMove("down")}
            className="p-2 bg-blue-500 text-white rounded"
          >
            ↓
          </button>
          <button
            onClick={placeMine}
            className="p-2 bg-red-500 text-white rounded"
          >
            地雷
          </button>
        </div>
      )}
      <div className="mt-4">
        <p>矢印キー: 移動</p>
        <p>スペースキー: 地雷設置</p>
      </div>
    </div>
  );
};

export default Game;
