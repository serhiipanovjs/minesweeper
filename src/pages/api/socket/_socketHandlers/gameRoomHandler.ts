import {cacheRoomsCleaner} from "../_socketHelpers";

export const playerIsReady = ({socket, io, CacheRooms}: any) => {
  socket.on("game_room:player_is_ready", ({roomId}: any) => {
    const room = CacheRooms.get(roomId)

    if (!room) {
      return;
    }

    const {
      isGameStarted,
      isGameFinish,
      startGameCounterIsActive,
      firstPlayerSocketId,
      secondPlayerSocketId,
      playersIsReady,
      playersLeftTheGame,
      timerStartValue,
      singlePlayer,
    } = room;
    const {id: socketId} = socket;

    if (isGameStarted || startGameCounterIsActive) {
      return;
    }

    if (!(firstPlayerSocketId === socketId || secondPlayerSocketId === socketId)) {
      return;
    }

    if (singlePlayer) {
      if (isGameFinish) {
        const roomResetProps = {
          points: {
            [socketId]: timerStartValue,
          },
          isGameFinish: false,
          isGameStarted: false,
          startGameCounterIsActive: true,
        }

        CacheRooms.set(roomId, {
          ...room,
          ...roomResetProps,
          bombsPositions: [],
          openedPositionsWithoutBombs: [],
          openedPositionsWithBombs: [],
        })

        socket.emit("game_room:reset_game", roomResetProps);

      } else {
        CacheRooms.set(roomId, {
          ...room,
          startGameCounterIsActive: true,
        })
      }
      socket.emit("game_room:start_game_counter_is_run");
      runGameTimer({CacheRooms, roomId, io, socket, firstPlayerSocketId, secondPlayerSocketId, singlePlayer})
      return;
    }

    const somePlayerIsLeftTheGame = playersLeftTheGame[firstPlayerSocketId] || playersLeftTheGame[secondPlayerSocketId]

    if (somePlayerIsLeftTheGame) {
      return;
    }

    const playersIsReadyUpdated = {
      ...playersIsReady,
      [socketId]: !playersIsReady[socketId]
    }

    room.playersIsReady = playersIsReadyUpdated

    if (!playersIsReadyUpdated[firstPlayerSocketId] || !playersIsReadyUpdated[secondPlayerSocketId]) {
      CacheRooms.set(roomId, room)
      io.to(roomId).emit("game_room:ready_status_changed", playersIsReadyUpdated);
      return;
    }

    const playersIsReadyReset = {
      [firstPlayerSocketId]: false,
      [secondPlayerSocketId]: false
    }

    if (isGameFinish) {
      const roomResetProps = {
        points: {
          [firstPlayerSocketId]: timerStartValue,
          [secondPlayerSocketId]: timerStartValue,
        },
        playersIsReady: playersIsReadyReset,
        isGameFinish: false,
        isGameStarted: false,
        startGameCounterIsActive: true,
      }

      CacheRooms.set(roomId, {
        ...room,
        ...roomResetProps,
        bombsPositions: [],
        openedPositionsWithoutBombs: [],
        openedPositionsWithBombs: [],
      })

      io.to(roomId).emit("game_room:reset_game", roomResetProps);

    } else {
      CacheRooms.set(roomId, {
        ...room,
        startGameCounterIsActive: true,
        playersIsReady: playersIsReadyReset
      })
    }

    io.to(roomId).emit("game_room:start_game_counter_is_run");
    io.to(roomId).emit("game_room:ready_status_changed", playersIsReadyReset);

    runGameTimer({CacheRooms, roomId, io, socket, firstPlayerSocketId, secondPlayerSocketId, singlePlayer})

  });
}

export const onPositionOpened = ({socket, io, CacheRooms}: any) => {
  socket.on("game_room:on_position_open", (arg: any) => {

    const {roomId, rowIndex, columnIndex} = arg;
    const {id: socketId} = socket;
    const room = CacheRooms.get(roomId)

    if (!room) {
      return;
    }

    const {
      width,
      height,
      openedPositionsWithoutBombs,
      openedPositionsWithBombs,
      bombsCount,
      points,
      firstPlayerSocketId,
      secondPlayerSocketId,
      playersLeftTheGame,
      startGameCounterIsActive,
      isGameStarted,
      isGameFinish,
      singlePlayer
    } = room

    if (rowIndex >= width || columnIndex >= height) {
      return;
    }

    if (isGameFinish || !isGameStarted || startGameCounterIsActive) {
      return;
    }

    if (!(firstPlayerSocketId === socketId || secondPlayerSocketId === socketId)) {
      return;
    }

    if (playersLeftTheGame[socketId]) {
      return;
    }

    const activePosition = {x: rowIndex, y: columnIndex}

    if (!room.bombsPositions.length) {
      const bombsPositions = bombGenerator(
        height,
        width,
        bombsCount,
        activePosition
      )
      CacheRooms.set(roomId, {...room, bombsPositions})
      room.bombsPositions = bombsPositions;
    }

    const {bombsPositions} = room

    const ifBomb = bombsPositions.some((position: any) => position.x === rowIndex && position.y === columnIndex)

    let activePositionPoints: number
    const openedPositionsWithoutBombsForActivePosition = []
    const openedPositionsWithBombsForActivePosition = []

    if (ifBomb) {
      openedPositionsWithBombsForActivePosition.push({
        ...activePosition,
        count: 10,
      })

      activePositionPoints = -10
    } else {
      const pointsAround = positionAroundFinder(
        rowIndex,
        columnIndex,
        width,
        height,
        [
          ...openedPositionsWithoutBombs,
          {
            ...activePosition,
            count: 0
          }
        ]
      )
      const bombsAroundPosition = bombsCounterAroundPosition(pointsAround, bombsPositions)

      if (bombsAroundPosition === 0) {
        const positionsWithoutBombAround = positionsAroundZeroPositions(
          width,
          height,
          pointsAround,
          [{
            ...activePosition,
            count: 0
          }],
          bombsPositions,
          [
            ...openedPositionsWithoutBombs,
            {
              ...activePosition,
              count: 0
            }
          ])
        openedPositionsWithoutBombsForActivePosition.push(...positionsWithoutBombAround)

        activePositionPoints = 0
      } else {
        openedPositionsWithoutBombsForActivePosition.push({
          ...activePosition,
          count: bombsAroundPosition,
        })
        activePositionPoints = bombsAroundPosition;
      }
    }
    const openedPositionsWithoutBombsCount = openedPositionsWithoutBombs.length + openedPositionsWithoutBombsForActivePosition.length;
    const activePlayerPoints = points[socketId] + activePositionPoints
    const isGameFinishUpdated = openedPositionsWithoutBombsCount >= ((width * height) - bombsCount) || activePlayerPoints < 0;

    const updatedRoom = {
      points: {
        ...points,
        [socketId]: activePlayerPoints
      },
      isGameFinish: isGameFinishUpdated,
      isGameStarted: !isGameFinishUpdated
    }

    CacheRooms.set(roomId, {
      ...room,
      ...updatedRoom,
      openedPositionsWithoutBombs: [...openedPositionsWithoutBombs, ...openedPositionsWithoutBombsForActivePosition],
      openedPositionsWithBombs: [...openedPositionsWithBombs, ...openedPositionsWithBombsForActivePosition],
    })

    if (singlePlayer) {
      socket.emit("game_room:on_position_open_result", {
        ...updatedRoom,
        result: [...openedPositionsWithoutBombsForActivePosition, ...openedPositionsWithBombsForActivePosition],
      });
    } else {
      io.to(roomId).emit("game_room:on_position_open_result", {
        ...updatedRoom,
        result: [...openedPositionsWithoutBombsForActivePosition, ...openedPositionsWithBombsForActivePosition],
      });
    }
  });
}

export const exitFromGameRoom = ({socket, io, CacheRooms}: any) => {
  socket.on("game_room:leave", () => {
    cacheRoomsCleaner({socket, io, CacheRooms})
  });
}

// @ts-ignore
const bombGenerator = (height: any, width: any, bombsCount: any, startPosition: any, bombsPositions: any = []) => {
  const position = {
    x: Math.round(Math.random() * (width - 1)),
    y: Math.round(Math.random() * (height - 1))
  }

  const duplicateStartPosition = position.x === startPosition.x && position.y === startPosition.y
  const duplicateNewPosition = bombsPositions.some((bombsPosition: any) => bombsPosition.x === position.x && bombsPosition.y === position.y)
  if (duplicateStartPosition || duplicateNewPosition) {
    return bombGenerator(height, width, bombsCount, startPosition, bombsPositions)
  }
  return bombsCount ? bombGenerator(height, width, bombsCount - 1, startPosition, [...bombsPositions, position]) : bombsPositions
}

const positionAroundFinder = (rowIndex: any, columnIndex: any, width: any, height: any, openedPositionsWithoutBombs: any) => {
  return [
    {
      x: rowIndex - 1,
      y: columnIndex - 1,
    },
    {
      x: rowIndex - 1,
      y: columnIndex,
    },
    {
      x: rowIndex - 1,
      y: columnIndex + 1,
    },
    {
      x: rowIndex,
      y: columnIndex - 1,
    },
    {
      x: rowIndex,
      y: columnIndex + 1,
    },
    {
      x: rowIndex + 1,
      y: columnIndex - 1,
    },
    {
      x: rowIndex + 1,
      y: columnIndex,
    },
    {
      x: rowIndex + 1,
      y: columnIndex + 1,
    }
  ]
    .filter(position => !(position.y < 0 || position.x < 0 || position.y > height - 1 || position.x > width - 1))
    .filter(position => !openedPositionsWithoutBombs.some((pos: any) => pos.x === position.x && pos.y === position.y))
}

const bombsCounterAroundPosition = (pointsAround: any, bombsPositions: any) => {
  return pointsAround.reduce((acc: any, item: any) => {
    const ifBomb = bombsPositions.some((position: any) => position.x === item.x && position.y === item.y)
    if (ifBomb) return acc + 1
    return acc
  }, 0)
}

// @ts-ignore
const positionsAroundZeroPositions = (width, height, pointsAround, result, bombsPositions, openedPositionsWithoutBombs) => {
  const pointsAroundGroupOfPoints = pointsAround.reduce((acc: any, pos: any) => {
    const positionAround = positionAroundFinder(pos.x, pos.y, width, height, openedPositionsWithoutBombs)
    const bombsAroundPosition = bombsCounterAroundPosition(positionAround, bombsPositions)
    return [
      ...acc,
      {
        ...pos,
        count: bombsAroundPosition
      }
    ]
  }, [])

  const pointsAroundGroupOfPointsWithZeroValue = pointsAroundGroupOfPoints.filter((ii: any) => ii.count === 0)

  if (pointsAroundGroupOfPointsWithZeroValue.length) {
    const pointsAroundZeroPoints = pointsAroundGroupOfPointsWithZeroValue.reduce((acc: any, item: any) => {
      const pointsAround = positionAroundFinder(item.x, item.y, width, height, [...openedPositionsWithoutBombs, ...pointsAroundGroupOfPoints, ...acc])
      return [...acc, ...pointsAround]
    }, [])

    return positionsAroundZeroPositions(width, height, pointsAroundZeroPoints, [...result, ...pointsAroundGroupOfPoints], bombsPositions, [...openedPositionsWithoutBombs, ...pointsAroundGroupOfPoints])
  }

  return [...result, ...pointsAroundGroupOfPoints]

}

const runGameTimer = ({
                        CacheRooms,
                        roomId,
                        io,
                        socket,
                        singlePlayer
                      }: any) => {
  const timeOutId = setTimeout(() => {
    const timeOutUpdatedRoom = CacheRooms.get(roomId)

    if (!timeOutUpdatedRoom || timeOutUpdatedRoom.isGameFinish) {
      clearTimeout(timeOutId);
      return;
    }

    CacheRooms.set(roomId, {
      ...timeOutUpdatedRoom,
      isGameStarted: true,
      startGameCounterIsActive: false,
    })

    if (singlePlayer) {
      socket.emit("game_room:start_game");
    } else {
      io.to(roomId).emit("game_room:start_game");
    }


    const intervalId = setInterval(() => {
      const intervalUpdatedRoom = CacheRooms.get(roomId)

      if (!intervalUpdatedRoom || intervalUpdatedRoom.isGameFinish) {
        clearInterval(intervalId);
        return;
      }

      for (const playerSocketId in intervalUpdatedRoom.points) {
        intervalUpdatedRoom.points[playerSocketId] = intervalUpdatedRoom.points[playerSocketId] - 1
      }

      const isCounterLessThenZero = Object.values(intervalUpdatedRoom.points).some((point: any) => point < 0)

      if (isCounterLessThenZero) {
        intervalUpdatedRoom.isGameFinish = true;
        intervalUpdatedRoom.isGameStarted = false;
        clearInterval(intervalId);
      }

      CacheRooms.set(roomId, intervalUpdatedRoom)


      if (singlePlayer) {
        socket.emit("game_room:on_position_open_result", {
          points: intervalUpdatedRoom.points,
          isGameFinish: intervalUpdatedRoom.isGameFinish,
          result: [],
        });
      } else {
        io.to(roomId).emit("game_room:on_position_open_result", {
          points: intervalUpdatedRoom.points,
          isGameFinish: intervalUpdatedRoom.isGameFinish,
          result: [],
        });
      }
    }, 1000)
  }, 3000)
}