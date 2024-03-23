"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect, ReactNode
} from "react";

import {io} from "socket.io-client"

const SocketContext = createContext({
  socket: null,
  isConnected: false
})

export const useSocket = () => {
  return useContext(SocketContext)
}

export const SocketProvider = ({children}: { children: ReactNode }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = new (io as any)(process.env.NEXT_PUBLIC_SITE_URL!, {
      path: "/api/socket/io",
      addTrailingSlash: false
    })

    socketInstance.on("connect", () => {
      console.log("Connected")
      setIsConnected(true)
      setSocket(socketInstance)
    })

    socketInstance.on("disconnect", () => {
      console.log("Disconnected")
      setIsConnected(false)
    })

    socketInstance.on("connect_error", async (err: { message: any; }) => {
      console.log(`connect_error due to ${err.message}`)
    })

    return () => {
      socketInstance.disconnect()
    }
  }, []);

  return (
    <SocketContext.Provider value={{socket, isConnected}}>
      {children}
    </SocketContext.Provider>
  )
}