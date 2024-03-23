import {v4 as uuidv4} from "uuid";

import {WAITING_ROOM} from "../_socketVariablesAndConstants";
import {
  cacheGameVariantsCleanByPlayerId,
  cacheGameVariantsCleaner,
  getCacheRoomsByPlayersSocketId
} from "../_socketHelpers";

export const enterToTheWaitingRoom = ({socket, io, cacheGameVariants}: any) => {
  socket.on("waiting_room:enter", () => {
    socket.join(WAITING_ROOM);
    io.to(WAITING_ROOM).emit("waiting_room:multiplayer_game_variants_changed", cacheGameVariants);
  });
}

export const getDefaultGameVariants = ({socket, gameVariantsDefault}: any) => {
  socket.on("waiting_room:get_default_game_variants", () => {
    socket.emit("waiting_room:request_default_game_variants", gameVariantsDefault);
  });
}

export const setGameVariantSinglePlayer = ({socket, gameVariantsDefault, CacheRooms}: any) => {
  socket.on("waiting_room:single_player_select_game_variant", ({gameVariantId}: any) => {
    const {id: socketId} = socket;

    const activeGameVariantIndex = gameVariantsDefault.findIndex((variant: any) => +variant.id === +gameVariantId);

    if (!Number.isInteger(activeGameVariantIndex)) {
      return;
    }

    const activeGameVariant = gameVariantsDefault[activeGameVariantIndex];

    const {
      width,
      height,
      bombsCount,
      timerStartValue
    } = activeGameVariant

    const roomId = uuidv4();

    const roomDefaultValues = {
      width,
      height,
      points: {
        [socketId]: timerStartValue,
      },
      playersIsReady: {
        [socketId]: false,
      },
      playersLeftTheGame: {
        [socketId]: false,
      },
      isGameFinish: false,
      isGameStarted: false,
      startGameCounterIsActive: false,
      singlePlayer: true,
    }
    CacheRooms.set(roomId, {
      firstPlayerSocketId: socketId,
      secondPlayerSocketId: "",
      bombsCount,
      bombsPositions: [],
      openedPositionsWithoutBombs: [],
      openedPositionsWithBombs: [],
      timerStartValue,
      ...roomDefaultValues
    })

    socket.emit("waiting_room:single_player_game_room_is_ready", {
      roomId,
      ...roomDefaultValues
    });

  });
}

export const changeGameVariant = ({socket, io, cacheGameVariants, CacheRooms}: any) => {
  socket.on("waiting_room:multiplayer_select_game_variant", ({gameVariantId}: any) => {
    const {id: socketId} = socket;

    const activeGameVariantIndex = cacheGameVariants.findIndex((variant: any) => +variant.id === +gameVariantId);

    if (!Number.isInteger(activeGameVariantIndex)) {
      return;
    }

    const disconnectedPlayerRooms = getCacheRoomsByPlayersSocketId(CacheRooms, socketId)

    if (disconnectedPlayerRooms.length) {
      const canNotCreateNewRoom = disconnectedPlayerRooms.some(([_, roomValue]) => !roomValue.playersLeftTheGame[socketId])
      if (canNotCreateNewRoom) {
        return;
      }
    }

    const activeGameVariant = cacheGameVariants[activeGameVariantIndex];

    const {
      firstPlayerSocketId,
      width,
      height,
      roomId,
      bombsCount,
      timerStartValue,
    } = activeGameVariant

    const isPlayerChoseSameVariant = firstPlayerSocketId === socketId;

    if (isPlayerChoseSameVariant) {
      cacheGameVariants[activeGameVariantIndex] = {
        ...activeGameVariant,
        roomId: "",
        firstPlayerSocketId: "",
      }
      socket.leave(roomId);
      io.to(WAITING_ROOM).emit("waiting_room:multiplayer_game_variants_changed", cacheGameVariants);
      return;
    }

    const firstPlayerPrevRoomIndex = cacheGameVariants.findIndex(({firstPlayerSocketId}: any) => firstPlayerSocketId === socketId);

    if (Number.isInteger(firstPlayerPrevRoomIndex)) {
      cacheGameVariantsCleanByPlayerId(cacheGameVariants, firstPlayerPrevRoomIndex, socket)
    }

    if (!firstPlayerSocketId && !roomId) {
      const roomId = uuidv4();
      socket.join(roomId);
      cacheGameVariants[activeGameVariantIndex] = {
        ...activeGameVariant,
        roomId,
        firstPlayerSocketId: socketId,
      }
    } else {
      cacheGameVariants[activeGameVariantIndex] = {
        ...activeGameVariant,
        roomId: "",
        firstPlayerSocketId: "",
      }

      const roomDefaultValues = {
        width,
        height,
        points: {
          [firstPlayerSocketId]: timerStartValue,
          [socketId]: timerStartValue,
        },
        playersIsReady: {
          [firstPlayerSocketId]: false,
          [socketId]: false,
        },
        playersLeftTheGame: {
          [firstPlayerSocketId]: false,
          [socketId]: false,
        },
        isGameFinish: false,
        isGameStarted: false,
        startGameCounterIsActive: false,
        singlePlayer: false,
      }
      CacheRooms.set(roomId, {
        firstPlayerSocketId,
        secondPlayerSocketId: socketId,
        bombsCount,
        bombsPositions: [],
        openedPositionsWithoutBombs: [],
        openedPositionsWithBombs: [],
        timerStartValue,
        ...roomDefaultValues
      })

      socket.join(roomId);

      io.to(roomId).emit("waiting_room:multiplayer_game_room_is_ready", {
        roomId,
        ...roomDefaultValues
      });
    }

    io.to(WAITING_ROOM).emit("waiting_room:multiplayer_game_variants_changed", cacheGameVariants);

  });
}


export const exitFromWaitingRoom = ({socket, io, cacheGameVariants}: any) => {
  socket.on("waiting_room:leave", () => {
    cacheGameVariantsCleaner({socket, io, cacheGameVariants})
  });
}