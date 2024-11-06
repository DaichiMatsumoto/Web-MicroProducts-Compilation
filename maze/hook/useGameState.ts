import { useState, useCallback, useEffect } from "react";
import { stages } from "./stages";

interface Position {
  x: number;
  y: number;
}

interface Watcher extends Position {
  direction: number; // 0: 上, 1: 右, 2: 下, 3: 左
}

interface Player extends Position {
  direction: number; // 0: 上, 1: 右, 2: 下, 3: 左
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

  const isInSight = (watcher: Watcher, player: Player) => {
    const dx = player.x - watcher.x;
    const dy = player.y - watcher.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 5) return false; // 視野の範囲

    const angle = Math.atan2(dy, dx);
    const watcherAngle = (watcher.direction * Math.PI) / 2;
    const angleDiff = Math.abs(angle - watcherAngle);
    return angleDiff <= Math.PI / 4 || angleDiff >= (Math.PI * 7) / 4;
  };

  const areFacing = (watcher: Watcher, player: Player) => {
    const dx = player.x - watcher.x;
    const dy = player.y - watcher.y;
    const playerDirection = (player.direction + 2) % 4; // プレイヤーの反対方向

    return (
      (dx === 0 &&
        dy < 0 &&
        watcher.direction === 0 &&
        playerDirection === 2) ||
      (dx === 0 &&
        dy > 0 &&
        watcher.direction === 2 &&
        playerDirection === 0) ||
      (dy === 0 &&
        dx < 0 &&
        watcher.direction === 3 &&
        playerDirection === 1) ||
      (dy === 0 && dx > 0 && watcher.direction === 1 && playerDirection === 3)
    );
  };

  const moveWatchers = useCallback(() => {
    setWatcherPositions((prev) =>
      prev.map((watcher) => {
        let newX = watcher.x;
        let newY = watcher.y;
        let newDirection = watcher.direction;

        if (areFacing(watcher, playerPosition)) {
          // プレイヤーと向かい合っている場合、一直線に向かう
          const dx = playerPosition.x - watcher.x;
          const dy = playerPosition.y - watcher.y;
          if (Math.abs(dx) > Math.abs(dy)) {
            newX += Math.sign(dx);
            newDirection = dx > 0 ? 1 : 3;
          } else {
            newY += Math.sign(dy);
            newDirection = dy > 0 ? 2 : 0;
          }
        } else if (isInSight(watcher, playerPosition)) {
          // プレイヤーが視野内にいる場合、追跡
          const dx = playerPosition.x - watcher.x;
          const dy = playerPosition.y - watcher.y;
          newDirection = Math.round(Math.atan2(dy, dx) / (Math.PI / 2)) % 4;
          switch (newDirection) {
            case 0:
              newY--;
              break;
            case 1:
              newX++;
              break;
            case 2:
              newY++;
              break;
            case 3:
              newX--;
              break;
          }
        } else {
          // ランダムに方向転換
          newDirection =
            (watcher.direction + Math.floor(Math.random() * 3) - 1 + 4) % 4;
          switch (newDirection) {
            case 0:
              newY--;
              break;
            case 1:
              newX++;
              break;
            case 2:
              newY++;
              break;
            case 3:
              newX--;
              break;
          }
        }

        // 壁に当たった場合、別の方向を試す
        if (maze[newY][newX] === 1) {
          const directions = [0, 1, 2, 3].filter((d) => d !== newDirection);
          for (const d of directions) {
            newX = watcher.x;
            newY = watcher.y;
            switch (d) {
              case 0:
                newY--;
                break;
              case 1:
                newX++;
                break;
              case 2:
                newY++;
                break;
              case 3:
                newX--;
                break;
            }
            if (maze[newY][newX] !== 1) {
              newDirection = d;
              break;
            }
          }
        }

        return { x: newX, y: newY, direction: newDirection };
      })
    );
  }, [playerPosition, maze]);

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
          nextStage.watcherStarts.map((start) => ({ ...start, direction: 0 }))
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
      initialStage.watcherStarts.map((start) => ({ ...start, direction: 0 }))
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
