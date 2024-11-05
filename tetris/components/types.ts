export type TetrisBoard = (string | 0)[][];

export interface TetrisPiece {
  shape: number[][];
  color: string;
  x: number;
  y: number;
}

export interface GameState {
  board: TetrisBoard;
  currentPiece: TetrisPiece | null;
  heldPiece: TetrisPiece | null;
  nextPieces: TetrisPiece[];
  gameOver: boolean;
  score: number;
  level: number;
  calculateDropPosition: (piece: TetrisPiece, board: TetrisBoard) => number;
  showBonus: boolean;
}

export interface GameActions {
  moveHorizontally: (direction: number) => void;
  hardDrop: () => void;
  rotate: () => void;
  holdPiece: () => void;
  restartGame: () => void;
}
