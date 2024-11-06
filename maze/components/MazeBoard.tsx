"use client";

import React, { useRef, useEffect } from "react";

interface MazeBoardProps {
  maze: number[][];
  playerPosition: { x: number; y: number; direction: number };
  watcherPositions: { x: number; y: number; direction: number }[];
  mines: { x: number; y: number }[];
}

const MazeBoard: React.FC<MazeBoardProps> = ({
  maze,
  playerPosition,
  watcherPositions,
  mines,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellSize = 30;
    canvas.width = maze[0].length * cellSize;
    canvas.height = maze.length * cellSize;

    // 迷路の描画
    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        ctx.fillStyle = cell === 1 ? "#000" : cell === 2 ? "#0f0" : "#fff";
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      });
    });

    // プレイヤーの描画
    ctx.fillStyle = "#00f";
    ctx.beginPath();
    ctx.arc(
      (playerPosition.x + 0.5) * cellSize,
      (playerPosition.y + 0.5) * cellSize,
      cellSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // プレイヤーの向きを示す矢印の描画
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(
      (playerPosition.x + 0.5) * cellSize,
      (playerPosition.y + 0.5) * cellSize
    );
    const angle = ((playerPosition.direction - 1) * Math.PI) / 2;
    ctx.lineTo(
      (playerPosition.x + 0.5 + 0.4 * Math.cos(angle)) * cellSize,
      (playerPosition.y + 0.5 + 0.4 * Math.sin(angle)) * cellSize
    );
    ctx.stroke();

    // 監視人の描画
    watcherPositions.forEach((watcher) => {
      // 視野の描画
      ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
      ctx.beginPath();
      ctx.moveTo((watcher.x + 0.5) * cellSize, (watcher.y + 0.5) * cellSize);
      const watcherAngle = ((watcher.direction - 1) * Math.PI) / 2;
      ctx.arc(
        (watcher.x + 0.5) * cellSize,
        (watcher.y + 0.5) * cellSize,
        5 * cellSize,
        watcherAngle - Math.PI / 4,
        watcherAngle + Math.PI / 4
      );
      ctx.closePath();
      ctx.fill();

      // 監視人の本体の描画
      ctx.fillStyle = "#f00";
      ctx.beginPath();
      ctx.arc(
        (watcher.x + 0.5) * cellSize,
        (watcher.y + 0.5) * cellSize,
        cellSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 監視人の向きを示す矢印の描画
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo((watcher.x + 0.5) * cellSize, (watcher.y + 0.5) * cellSize);
      ctx.lineTo(
        (watcher.x + 0.5 + 0.4 * Math.cos(watcherAngle)) * cellSize,
        (watcher.y + 0.5 + 0.4 * Math.sin(watcherAngle)) * cellSize
      );
      ctx.stroke();
    });

    // 地雷の描画
    ctx.fillStyle = "#000";
    mines.forEach((mine) => {
      ctx.beginPath();
      ctx.arc(
        (mine.x + 0.5) * cellSize,
        (mine.y + 0.5) * cellSize,
        cellSize / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }, [maze, playerPosition, watcherPositions, mines]);

  return <canvas ref={canvasRef} />;
};

export default MazeBoard;
