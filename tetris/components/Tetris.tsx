"use client";

import React from "react";
import { useTetris } from "./TetrisLogic";
import { TetrisBoard } from "./TetrisBoard";
import { HeldPiece } from "./HeldPiece";
import { NextPieces } from "./NextPieces";
import { Button } from "@/components/ui/button";

export default function Tetris() {
  const [
    { board, currentPiece, heldPiece, nextPieces, gameOver, score, level },
    { restartGame },
  ] = useTetris();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Tetris</h1>
      <div className="flex items-start gap-4">
        <HeldPiece piece={heldPiece} />
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <TetrisBoard board={board} currentPiece={currentPiece} />
        </div>
        <NextPieces pieces={nextPieces} />
      </div>
      <div className="mt-4 text-xl font-bold">
        <span className="mr-4">スコア: {score}</span>
        <span>レベル: {level}</span>
      </div>
      {gameOver && (
        <div className="mt-4 text-center">
          <p className="text-2xl font-bold text-red-500 mb-2">ゲームオーバー</p>
          <Button onClick={restartGame}>もう一度プレイ</Button>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-600">
        <p>操作方法:</p>
        <p>← → : 左右移動</p>
        <p>↓ : 下に移動</p>
        <p>↑ : 回転</p>
        <p>スペース : テトリミノを保留</p>
      </div>
    </div>
  );
}
