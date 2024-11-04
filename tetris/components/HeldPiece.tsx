import React from "react";
import type { TetrisPiece } from "./types";

interface HeldPieceProps {
  piece: TetrisPiece | null;
}

export function HeldPiece({ piece }: HeldPieceProps) {
  if (!piece) return null;

  return (
    <div className="bg-white p-2 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-2">保留中</h2>
      <div className="grid grid-cols-4 gap-px">
        {piece.shape.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className={`w-6 h-6 ${cell ? piece.color : "bg-gray-100"}`}
              aria-label={cell ? "ブロック" : "空きマス"}
            />
          ))
        )}
      </div>
    </div>
  );
}
