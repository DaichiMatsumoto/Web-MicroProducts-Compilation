"use client";

import { useState, useEffect, useCallback } from "react";
import type { TetrisPiece, TetrisBoard, GameState, GameActions } from "./types";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TETROMINOS = [
  { shape: [[1, 1, 1, 1]], color: "bg-cyan-500" },
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "bg-yellow-500",
  },
  {
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: "bg-purple-500",
  },
  {
    shape: [
      [1, 1, 1],
      [1, 0, 0],
    ],
    color: "bg-orange-500",
  },
  {
    shape: [
      [1, 1, 1],
      [0, 0, 1],
    ],
    color: "bg-blue-500",
  },
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "bg-green-500",
  },
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "bg-red-500",
  },
];

export function useTetris(): [GameState, GameActions] {
  const createEmptyBoard = () =>
    Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

  const [board, setBoard] = useState<TetrisBoard>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<TetrisPiece | null>(null);
  const [heldPiece, setHeldPiece] = useState<TetrisPiece | null>(null);
  const [nextPieces, setNextPieces] = useState<TetrisPiece[]>([]);
  const [canHold, setCanHold] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  const newPiece = useCallback(() => {
    const randomTetromino =
      TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
    return {
      shape: randomTetromino.shape,
      color: randomTetromino.color,
      x:
        Math.floor(BOARD_WIDTH / 2) -
        Math.floor(randomTetromino.shape[0].length / 2),
      y: 0,
    };
  }, []);

  const spawnNewPiece = useCallback(() => {
    if (nextPieces.length < 2) {
      setNextPieces((prev) => [...prev, newPiece(), newPiece()]);
    }
    setCurrentPiece(nextPieces[0]);
    setNextPieces((prev) => [...prev.slice(1), newPiece()]);
    setCanHold(true);
  }, [newPiece, nextPieces]);

  const checkCollision = useCallback(
    (
      piece: TetrisPiece,
      board: TetrisBoard,
      movement: { x: number; y: number }
    ) => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const newX = piece.x + x + movement.x;
            const newY = piece.y + y + movement.y;
            if (
              newX < 0 ||
              newX >= BOARD_WIDTH ||
              newY >= BOARD_HEIGHT ||
              (board[newY] && board[newY][newX])
            ) {
              return true;
            }
          }
        }
      }
      return false;
    },
    []
  );

  const moveDown = useCallback(() => {
    if (!currentPiece) return;
    if (checkCollision(currentPiece, board, { x: 0, y: 1 })) {
      const newBoard = board.map((row) => [...row]);
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            newBoard[y + currentPiece.y][x + currentPiece.x] =
              currentPiece.color;
          }
        });
      });
      setBoard(newBoard);
      let linesCleared = 0;
      const clearedBoard = newBoard.filter((row) => {
        if (row.every((cell) => cell !== 0)) {
          linesCleared++;
          return false;
        }
        return true;
      });
      while (clearedBoard.length < BOARD_HEIGHT) {
        clearedBoard.unshift(Array(BOARD_WIDTH).fill(0));
      }
      setBoard(clearedBoard);
      setScore((prev) => {
        const newScore = prev + linesCleared * 100 * level;
        if (newScore > level * 1000) {
          setLevel((prevLevel) => prevLevel + 1);
        }
        return newScore;
      });
      spawnNewPiece();
      return;
    }
    setCurrentPiece((prev) => (prev ? { ...prev, y: prev.y + 1 } : null));
  }, [currentPiece, board, checkCollision, level, spawnNewPiece]);

  const moveHorizontally = useCallback(
    (direction: number) => {
      if (!currentPiece) return;
      if (!checkCollision(currentPiece, board, { x: direction, y: 0 })) {
        setCurrentPiece((prev) =>
          prev ? { ...prev, x: prev.x + direction } : null
        );
      }
    },
    [currentPiece, board, checkCollision]
  );

  const rotate = useCallback(() => {
    if (!currentPiece) return;
    const rotated = currentPiece.shape[0].map((_, index) =>
      currentPiece.shape.map((row) => row[index]).reverse()
    );
    if (
      !checkCollision({ ...currentPiece, shape: rotated }, board, {
        x: 0,
        y: 0,
      })
    ) {
      setCurrentPiece((prev) => (prev ? { ...prev, shape: rotated } : null));
    }
  }, [currentPiece, board, checkCollision]);

  const holdPiece = useCallback(() => {
    if (!canHold || !currentPiece) return;
    setCanHold(false);
    if (heldPiece) {
      setCurrentPiece({
        ...heldPiece,
        x:
          Math.floor(BOARD_WIDTH / 2) -
          Math.floor(heldPiece.shape[0].length / 2),
        y: 0,
      });
      setHeldPiece(currentPiece);
    } else {
      setHeldPiece(currentPiece);
      spawnNewPiece();
    }
  }, [canHold, currentPiece, heldPiece, spawnNewPiece]);

  useEffect(() => {
    if (gameOver) return;
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          moveHorizontally(-1);
          break;
        case "ArrowRight":
          moveHorizontally(1);
          break;
        case "ArrowDown":
          moveDown();
          break;
        case "ArrowUp":
          rotate();
          break;
        case " ":
          holdPiece();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [gameOver, moveHorizontally, moveDown, rotate, holdPiece]);

  useEffect(() => {
    if (gameOver) return;
    const gameLoop = setInterval(() => {
      moveDown();
    }, 1000 - (level - 1) * 100);
    return () => {
      clearInterval(gameLoop);
    };
  }, [gameOver, moveDown, level]);

  useEffect(() => {
    if (!currentPiece && nextPieces.length === 0) {
      setNextPieces([newPiece(), newPiece()]);
      spawnNewPiece();
    }
  }, [currentPiece, nextPieces, newPiece, spawnNewPiece]);

  useEffect(() => {
    if (currentPiece && checkCollision(currentPiece, board, { x: 0, y: 0 })) {
      setGameOver(true);
    }
  }, [currentPiece, board, checkCollision]);

  // ゲーム開始時に最初のピースを生成する
  useEffect(() => {
    if (!currentPiece && nextPieces.length === 0) {
      setNextPieces([newPiece(), newPiece()]);
      setCurrentPiece(newPiece());
    }
  }, [currentPiece, newPiece, nextPieces.length]);

  const restartGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setHeldPiece(null);
    setNextPieces([]);
    setCanHold(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    // ゲーム再開時に最初のピースを生成する
    setNextPieces([newPiece(), newPiece()]);
    setCurrentPiece(newPiece());
  }, [newPiece]);

  return [
    { board, currentPiece, heldPiece, nextPieces, gameOver, score, level },
    { moveHorizontally, moveDown, rotate, holdPiece, restartGame },
  ];
}
