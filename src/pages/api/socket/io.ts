import type {Server as HTTPServer} from "http"
import type {Socket as NetSocket} from "net"
import type {NextApiRequest, NextApiResponse} from "next"
import type {Server as IOServer} from "socket.io"
import {Server} from "socket.io"
import {CacheRooms, cacheGameVariants, gameVariantsDefault} from "./_socketVariablesAndConstants"
import {
  changeGameVariant,
  enterToTheWaitingRoom,
  exitFromWaitingRoom,
  getDefaultGameVariants,
  setGameVariantSinglePlayer
} from "@/pages/api/socket/_socketHandlers/waitingRoomHandler";
import {exitFromGameRoom, onPositionOpened, playerIsReady} from "@/pages/api/socket/_socketHandlers/gameRoomHandler";
import {onDisconnectHandler} from "@/pages/api/socket/_socketHandlers/disconnectHandler";

export const config = {
  api: {
    bodyParser: false,
  },
}

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

export default function SocketHandler(_req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket.server.io) return

  const path = '/api/socket/io'
  const httpServer = res.socket.server

  const io = new Server(httpServer, {
    path,
    addTrailingSlash: false,
  })

  io.on("connection", (socket) => {

    enterToTheWaitingRoom({socket, io, cacheGameVariants});
    changeGameVariant({socket, io, cacheGameVariants, CacheRooms});

    getDefaultGameVariants({socket, gameVariantsDefault});
    setGameVariantSinglePlayer({socket, gameVariantsDefault, CacheRooms});

    exitFromWaitingRoom({socket, io, cacheGameVariants});

    playerIsReady({socket, io, CacheRooms})
    onPositionOpened({socket, io, CacheRooms})
    exitFromGameRoom({socket, io, CacheRooms});

    onDisconnectHandler({socket, io, cacheGameVariants, CacheRooms});

  });

  res.socket.server.io = io
}