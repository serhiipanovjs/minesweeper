import {WAITING_ROOM} from "@/pages/api/socket/_socketVariablesAndConstants";

export const getCacheRoomsByPlayersSocketId = (CacheRooms: any, playerSocketId: string) => {
  return [...CacheRooms]
    .filter(([_, value]) => value.firstPlayerSocketId === playerSocketId || value.secondPlayerSocketId === playerSocketId)
}
export const cacheGameVariantsCleanByPlayerId = (cacheGameVariants: any, firstPlayerPrevRoomIndex: any, socket: any) => {
  const firstPlayerPrevRoom = cacheGameVariants[firstPlayerPrevRoomIndex];
  if (!firstPlayerPrevRoom) return
  socket.leave(firstPlayerPrevRoom.roomId);
  cacheGameVariants[firstPlayerPrevRoomIndex] = {
    ...firstPlayerPrevRoom,
    roomId: "",
    firstPlayerSocketId: "",
  }
}

export const cacheRoomsCleaner = ({socket, io, CacheRooms}: any) => {
  const {id: socketId} = socket;
  const disconnectedPlayerRooms = getCacheRoomsByPlayersSocketId(CacheRooms, socketId)

  if (disconnectedPlayerRooms.length) {
    disconnectedPlayerRooms.forEach(([roomId, roomValues]: any) => {
      const room = CacheRooms.get(roomId)
      socket.leave(roomId)

      const {
        firstPlayerSocketId,
        secondPlayerSocketId,
        playersLeftTheGame,
        singlePlayer
      } = roomValues;

      if (singlePlayer) {
        CacheRooms.delete(roomId);
        return
      }

      const opponentSocketId = firstPlayerSocketId !== socketId ? firstPlayerSocketId :
        secondPlayerSocketId !== socketId ? secondPlayerSocketId : ''

      if (opponentSocketId) {
        const isOpponentLeftTheGame = playersLeftTheGame[opponentSocketId];
        if (isOpponentLeftTheGame) {
          CacheRooms.delete(roomId);
        } else {
          const playersLeftTheGameUpdated = {
            ...playersLeftTheGame,
            [socketId]: true,
          }

          CacheRooms.set(roomId, {
            ...room,
            playersLeftTheGame: playersLeftTheGameUpdated
          })
          return io.to(opponentSocketId).emit("game_room:opponent_left", playersLeftTheGameUpdated);
        }
      }
    })
  }
}

export const cacheGameVariantsCleaner = ({socket, io, cacheGameVariants}: any) => {
  socket.leave(WAITING_ROOM);
  const firstPlayerPrevRoomIndex = cacheGameVariants.findIndex(({firstPlayerSocketId}: any) => firstPlayerSocketId === socket.id);
  if (Number.isInteger(firstPlayerPrevRoomIndex)) {
    cacheGameVariantsCleanByPlayerId(cacheGameVariants, firstPlayerPrevRoomIndex, socket)
    io.to(WAITING_ROOM).emit("waiting_room:multiplayer_game_variants_changed", cacheGameVariants);
  }
}