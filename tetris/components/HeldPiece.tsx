import React from "react";
import type { TetrisPiece } from "./types";

interface HeldPieceProps {
  piece: TetrisPiece | null;
}

export function HeldPiece({ piece }: HeldPieceProps) {
  const gridSize = 4;
  const grid = Array(gridSize)
    .fill(0)
    .map(() => Array(gridSize).fill(0));

  if (piece) {
    const offsetY = Math.floor((gridSize - piece.shape.length) / 2);
    const offsetX = Math.floor((gridSize - piece.shape[0].length) / 2);

    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          grid[y + offsetY][x + offsetX] = 1;
        }
      });
    });
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-32">
      <h2 className="text-sm font-semibold mb-2">保留中</h2>
      <div className="grid grid-cols-4 gap-px bg-gray-100 p-px">
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className={`w-6 h-6 ${cell ? piece?.color : "bg-gray-100"}`}
              aria-label={cell ? "ブロック" : "空きマス"}
            />
          ))
        )}
      </div>
    </div>
  );
}
