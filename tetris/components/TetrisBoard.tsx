import React from "react";
import type { TetrisBoard, TetrisPiece } from "./types";

interface TetrisBoardProps {
  board: TetrisBoard;
  currentPiece: TetrisPiece | null;
  calculateDropPosition: (piece: TetrisPiece, board: TetrisBoard) => number;
}

export function TetrisBoard({
  board,
  currentPiece,
  calculateDropPosition,
}: TetrisBoardProps) {
  const renderBoard = () => {
    const renderedBoard = board.map((row) => [...row]);

    if (currentPiece) {
      const dropY = calculateDropPosition(currentPiece, board);

      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            // 現在のピースを描画
            if (
              y + currentPiece.y >= 0 &&
              y + currentPiece.y < 20 &&
              x + currentPiece.x >= 0 &&
              x + currentPiece.x < 10
            ) {
              renderedBoard[y + currentPiece.y][x + currentPiece.x] =
                currentPiece.color;
            }
            // 落下位置のガイドを描画
            if (
              y + dropY >= 0 &&
              y + dropY < 20 &&
              x + currentPiece.x >= 0 &&
              x + currentPiece.x < 10
            ) {
              if (renderedBoard[y + dropY][x + currentPiece.x] === 0) {
                renderedBoard[y + dropY][x + currentPiece.x] = "bg-gray-300";
              }
            }
          }
        });
      });
    }

    return renderedBoard;
  };

  return (
    <div className="grid grid-cols-10 gap-px bg-gray-700 p-px">
      {renderBoard().map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className={`w-6 h-6 ${cell || "bg-gray-900"}`}
            aria-label={cell ? "ブロック" : "空きマス"}
          />
        ))
      )}
    </div>
  );
}
