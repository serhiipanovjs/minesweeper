import {cacheGameVariantsCleaner, cacheRoomsCleaner} from "../_socketHelpers";

export const onDisconnectHandler = ({socket, io, cacheGameVariants, CacheRooms}: any) => {
  socket.on("disconnect", (reason: any) => {
    cacheGameVariantsCleaner({socket, io, cacheGameVariants})
    cacheRoomsCleaner({socket, io, CacheRooms})
  });
}