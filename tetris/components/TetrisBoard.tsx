import React from "react";
import type { TetrisBoard, TetrisPiece } from "./types";

interface TetrisBoardProps {
  board: TetrisBoard;
  currentPiece: TetrisPiece | null;
}

export function TetrisBoard({ board, currentPiece }: TetrisBoardProps) {
  return (
    <div className="grid grid-cols-10 gap-px bg-gray-300 p-px">
      {board.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className={`w-6 h-6 ${
              cell ||
              (currentPiece &&
                currentPiece.shape[y - currentPiece.y] &&
                currentPiece.shape[y - currentPiece.y][x - currentPiece.x])
                ? cell || currentPiece.color
                : "bg-gray-100"
            }`}
            aria-label={cell ? "ブロック" : "空きマス"}
          />
        ))
      )}
    </div>
  );
}
