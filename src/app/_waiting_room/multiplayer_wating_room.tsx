"use client"

import {useEffect} from "react";
import {useSocket} from "../../../components/providers/socket-provider";
import Loading from "../../../components/loading";
import GameVariantsList from "@/app/_waiting_room/components/gameVariantsList";

export default function MultiplayerWaitingRoom({
                                                 setActiveComponent,
                                                 waitingRooms
                                               }: any) {
  const {isConnected, socket}: any = useSocket()

  const onRoomClick = (id: any) => {
    if (isConnected) {
      socket.emit("waiting_room:multiplayer_select_game_variant", {gameVariantId: id});
    }
  }

  useEffect(() => {
    if (!isConnected) return

    socket.emit("waiting_room:enter");
    return () => {
      if (isConnected) {
        socket.emit("waiting_room:leave");
      }
    }
  }, [isConnected, socket]);

  if (!isConnected || !waitingRooms.length) {
    return <Loading/>
  }

  return <GameVariantsList
    setActiveComponent={setActiveComponent}
    waitingRooms={waitingRooms}
    onRoomClick={onRoomClick}
    socketId={socket.id}
  />
}