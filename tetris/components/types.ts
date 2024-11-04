export type TetrisPiece = {
  shape: number[][];
  color: string;
  x: number;
  y: number;
};

export type TetrisBoard = (string | 0)[][];

export type GameState = {
  board: TetrisBoard;
  currentPiece: TetrisPiece | null;
  heldPiece: TetrisPiece | null;
  gameOver: boolean;
  score: number;
  level: number;
};

export type GameActions = {
  moveHorizontally: (direction: number) => void;
  moveDown: () => void;
  rotate: () => void;
  holdPiece: () => void;
  restartGame: () => void;
};
