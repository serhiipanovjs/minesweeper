"use client"

import {useEffect} from "react";
import {useSocket} from "../../../components/providers/socket-provider";
import GameVariantsList from "@/app/_waiting_room/components/gameVariantsList";

export default function SinglePlayerWaitingRoom({
                                                  setActiveComponent,
                                                  waitingRooms
                                                }: any) {
  const {isConnected, socket}: any = useSocket()

  const onRoomClick = (id: any) => {
    if (isConnected) {
      socket.emit("waiting_room:single_player_select_game_variant", {gameVariantId: id});
    }
  }


  useEffect(() => {
    if (!isConnected) return;
    socket.emit("waiting_room:get_default_game_variants");
  }, [isConnected, socket]);


  if (!isConnected || !waitingRooms.length) {
    return <div>LOADING......</div>
  }

  return <GameVariantsList
    setActiveComponent={setActiveComponent}
    waitingRooms={waitingRooms}
    onRoomClick={onRoomClick}
    socketId={socket.id}
  />;
}