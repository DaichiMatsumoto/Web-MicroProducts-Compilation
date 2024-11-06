import { useState, useCallback, useEffect } from "react";
import { stages } from "./stages";

interface Position {
  x: number;
  y: number;
}

interface Player extends Position {
  direction: number;
}

interface Watcher extends Player {
  mode: "searching" | "chasing";
  targetPosition?: Position; // 追跡するプレイヤーの位置
}

export const useGameState = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [maze, setMaze] = useState(stages[currentStage].maze);
  const [playerPosition, setPlayerPosition] = useState<Player>({
    ...stages[currentStage].playerStart,
    direction: 1,
  });
  const [watcherPositions, setWatcherPositions] = useState<Watcher[]>(
    stages[currentStage].watcherStarts.map((start) => ({
      ...start,
      direction: 0,
      mode: "searching",
    }))
  );
  const [mines, setMines] = useState<Position[]>([]);
  const [gameStatus, setGameStatus] = useState<
    "playing" | "gameover" | "clear"
  >("playing");
  const [score, setScore] = useState(0);

  const getDistanceToGoal = useCallback(
    (x: number, y: number) => {
      const goalPosition = maze.reduce(
        (acc, row, y) => {
          const x = row.indexOf(2);
          return x !== -1 ? { x, y } : acc;
        },
        { x: -1, y: -1 }
      );
      return Math.abs(x - goalPosition.x) + Math.abs(y - goalPosition.y);
    },
    [maze] // maze が変わったときのみ新しい関数が生成される
  );

  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (gameStatus !== "playing") return;

      setPlayerPosition((prev) => {
        const newX = prev.x + dx;
        const newY = prev.y + dy;
        let newDirection = prev.direction;

        if (dx === 1) newDirection = 1;
        else if (dx === -1) newDirection = 3;
        else if (dy === 1) newDirection = 2;
        else if (dy === -1) newDirection = 0;

        if (maze[newY][newX] !== 1) {
          const oldDistance = getDistanceToGoal(prev.x, prev.y);
          const newDistance = getDistanceToGoal(newX, newY);
          if (newDistance < oldDistance) {
            setScore((prevScore) => prevScore + 10);
          } else if (newDistance > oldDistance) {
            setScore((prevScore) => Math.max(0, prevScore - 5));
          }
          return { x: newX, y: newY, direction: newDirection };
        }
        return { ...prev, direction: newDirection };
      });
    },
    [gameStatus, maze, getDistanceToGoal]
  );

  const placeMine = useCallback(() => {
    if (gameStatus !== "playing") return;

    setMines((prev) => {
      const { x, y, direction } = playerPosition;
      let mineX = x;
      let mineY = y;

      switch (direction) {
        case 0:
          mineY--;
          break;
        case 1:
          mineX++;
          break;
        case 2:
          mineY++;
          break;
        case 3:
          mineX--;
          break;
      }

      if (
        maze[mineY][mineX] !== 1 &&
        !prev.some((mine) => mine.x === mineX && mine.y === mineY)
      ) {
        return [...prev, { x: mineX, y: mineY }];
      }
      return prev;
    });
  }, [playerPosition, maze, gameStatus]);

  const areFacingEachOther = (watcher: Watcher, player: Player) => {
    // ウォッチャーとプレイヤーの位置関係
    const dx = player.x - watcher.x;
    const dy = player.y - watcher.y;

    // 距離が1以上離れている場合のみチェック
    if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
      // ウォッチャーがプレイヤーの方向を向いているか
      const watcherFacingPlayer =
        (dx === 0 && dy < 0 && watcher.direction === 0) ||
        (dx === 0 && dy > 0 && watcher.direction === 2) ||
        (dy === 0 && dx < 0 && watcher.direction === 3) ||
        (dy === 0 && dx > 0 && watcher.direction === 1);

      // プレイヤーがウォッチャーの方向を向いているか
      const playerFacingWatcher =
        (dx === 0 && dy > 0 && player.direction === 0) ||
        (dx === 0 && dy < 0 && player.direction === 2) ||
        (dy === 0 && dx > 0 && player.direction === 3) ||
        (dy === 0 && dx < 0 && player.direction === 1);

      return watcherFacingPlayer && playerFacingWatcher;
    }

    return false;
  };

  const getDeltaByDirection = useCallback((direction: number) => {
    switch (direction) {
      case 0:
        return { dx: 0, dy: -1 };
      case 1:
        return { dx: 1, dy: 0 };
      case 2:
        return { dx: 0, dy: 1 };
      case 3:
        return { dx: -1, dy: 0 };
      default:
        return { dx: 0, dy: 0 };
    }
  }, []);

  const getPossibleDirections = useCallback(
    (watcher: Watcher) => {
      const directions = [];
      for (let d = 0; d < 4; d++) {
        const delta = getDeltaByDirection(d);
        const nx = watcher.x + delta.dx;
        const ny = watcher.y + delta.dy;

        // 範囲チェック
        if (nx < 0 || ny < 0 || ny >= maze.length || nx >= maze[0].length) {
          continue;
        }

        if (maze[ny][nx] !== 1) {
          directions.push(d);
        }
      }
      // 壁を向かないように、現在の方向を優先
      return directions.filter((d) => d !== (watcher.direction + 2) % 4);
    },
    [getDeltaByDirection, maze]
  );

  const getDirection = (from: Watcher, to: Position) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dx === 1) return 1;
    if (dx === -1) return 3;
    if (dy === 1) return 2;
    if (dy === -1) return 0;
    return from.direction;
  };

  // 簡易的な経路探索アルゴリズム（例として幅優先探索を使用）
  const findPath = useCallback(
    (maze: number[][], start: Position, goal: Position) => {
      const queue: Position[] = [start];
      const visited = new Set<string>();
      const cameFrom = new Map<string, Position>();

      const startKey = `${start.x},${start.y}`;
      visited.add(startKey); // 開始地点を訪問済みに追加

      while (queue.length > 0) {
        const current = queue.shift()!;

        if (current.x === goal.x && current.y === goal.y) {
          // 経路を再構築
          const path: Position[] = [];
          let c: Position | undefined = current;
          while (c) {
            path.unshift(c);
            c = cameFrom.get(`${c.x},${c.y}`);
          }
          return path;
        }

        for (let d = 0; d < 4; d++) {
          const delta = getDeltaByDirection(d);
          const nx = current.x + delta.dx;
          const ny = current.y + delta.dy;
          const key = `${nx},${ny}`;

          // 範囲チェック
          if (nx < 0 || ny < 0 || ny >= maze.length || nx >= maze[0].length) {
            continue;
          }

          if (maze[ny][nx] !== 1 && !visited.has(key)) {
            visited.add(key);
            queue.push({ x: nx, y: ny });
            cameFrom.set(key, current);
          }
        }
      }
      return [];
    },
    [getDeltaByDirection]
  );

  const moveWatchers = useCallback(() => {
    setWatcherPositions((prev) =>
      prev.map((watcher) => {
        let newX = watcher.x;
        let newY = watcher.y;
        let newDirection = watcher.direction;
        let newMode = watcher.mode;
        let newTargetPosition = watcher.targetPosition;

        if (areFacingEachOther(watcher, playerPosition)) {
          // 視線が向き合った場合、追跡モードに移行
          newMode = "chasing";
          newTargetPosition = { x: playerPosition.x, y: playerPosition.y };
        }

        if (newMode === "chasing" && newTargetPosition) {
          // プレイヤーを追跡
          const path = findPath(
            maze,
            { x: watcher.x, y: watcher.y },
            newTargetPosition
          );
          if (path.length > 1) {
            // 次の位置へ移動
            newX = path[1].x;
            newY = path[1].y;
            // 方向を更新
            newDirection = getDirection(watcher, { x: newX, y: newY });
          } else {
            // プレイヤーを見失った場合、探索モードに戻る
            newMode = "searching";
            newTargetPosition = undefined;
          }
        } else {
          // 探索モードでの移動
          const possibleDirections = getPossibleDirections(watcher);
          if (possibleDirections.length > 0) {
            // 壁を避けて進める方向から選択
            newDirection =
              possibleDirections[
                Math.floor(Math.random() * possibleDirections.length)
              ];
            const delta = getDeltaByDirection(newDirection);
            newX += delta.dx;
            newY += delta.dy;
          } else {
            // 行き止まりの場合、反転
            newDirection = (watcher.direction + 2) % 4;
          }
        }

        return {
          x: newX,
          y: newY,
          direction: newDirection,
          mode: newMode,
          targetPosition: newTargetPosition,
        };
      })
    );
  }, [
    playerPosition,
    findPath,
    maze,
    getPossibleDirections,
    getDeltaByDirection,
  ]);

  useEffect(() => {
    if (gameStatus !== "playing") return;

    if (
      watcherPositions.some(
        (watcher) =>
          watcher.x === playerPosition.x && watcher.y === playerPosition.y
      )
    ) {
      setGameStatus("gameover");
    }

    if (
      mines.some(
        (mine) => mine.x === playerPosition.x && mine.y === playerPosition.y
      )
    ) {
      setMines((prev) =>
        prev.filter(
          (mine) => mine.x !== playerPosition.x || mine.y !== playerPosition.y
        )
      );
      setGameStatus("gameover");
    }

    if (maze[playerPosition.y][playerPosition.x] === 2) {
      if (currentStage === stages.length - 1) {
        setGameStatus("clear");
      } else {
        setCurrentStage((prev) => prev + 1);
        const nextStage = stages[currentStage + 1];
        setMaze(nextStage.maze);
        setPlayerPosition({ ...nextStage.playerStart, direction: 1 });
        setWatcherPositions(
          nextStage.watcherStarts.map((start) => ({
            ...start,
            direction: 0,
            mode: "searching",
          }))
        );
        setMines([]);
      }
    }

    const removedWatchers = watcherPositions.filter(
      (watcher) =>
        !mines.some((mine) => mine.x === watcher.x && mine.y === watcher.y)
    );
    if (removedWatchers.length < watcherPositions.length) {
      setScore((prevScore) => prevScore + 50);
      setWatcherPositions(removedWatchers);
      setMines((prev) =>
        prev.filter(
          (mine) =>
            !watcherPositions.some(
              (watcher) => watcher.x === mine.x && watcher.y === mine.y
            )
        )
      );
    }
  }, [playerPosition, watcherPositions, mines, maze, currentStage, gameStatus]);

  useEffect(() => {
    const interval = setInterval(moveWatchers, 500); // 0.5秒ごとに移動
    return () => clearInterval(interval);
  }, [moveWatchers]);

  const restartGame = useCallback(() => {
    setCurrentStage(0);
    const initialStage = stages[0];
    setMaze(initialStage.maze);
    setPlayerPosition({ ...initialStage.playerStart, direction: 1 });
    setWatcherPositions(
      initialStage.watcherStarts.map((start) => ({
        ...start,
        direction: 0,
        mode: "searching",
      }))
    );
    setMines([]);
    setGameStatus("playing");
    setScore(0);
  }, []);

  return {
    maze,
    playerPosition,
    watcherPositions,
    mines,
    gameStatus,
    score,
    movePlayer,
    placeMine,
    restartGame,
  };
};
