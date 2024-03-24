"use client"

import styles from "./page.module.scss"
import {useEffect, useState} from "react";
import MultiplayerWaitingRoom from "@/app/_waiting_room/multiplayer_wating_room";
import {useSocket} from "../../../components/providers/socket-provider";
import SinglePlayerWaitingRoom from "@/app/_waiting_room/single_player_wating_room";
import GameField from "@/app/_gameField/gameField";
import {fieldGenerator} from "@/app/_waiting_room/helpers";
import Image from 'next/image'

import PrimaryButton from "../../../components/buttons/primaryButton";
import Loading from "../../../components/loading";

export default function Dashboard() {
  const {isConnected, socket}: any = useSocket()
  const [activeComponent, setActiveComponent] = useState('')
  const [activeRoomId, setActiveRoomId] = useState(false)
  const [field, setField] = useState([]) as any
  const [gameData, setGameData] = useState({}) as any
  const [waitingRooms, setWaitingRooms] = useState([])

  useEffect(() => {
    if (!isConnected) return;

    socket.on('waiting_room:multiplayer_game_variants_changed', (waitingRooms: any) => {
      setWaitingRooms(waitingRooms)
    })
    socket.on('waiting_room:multiplayer_game_room_is_ready', (gameRoomValues: any) => {
      const {
        roomId,
        height,
        width,
        points,
        playersIsReady,
        playersLeftTheGame,
        isGameFinish,
        isGameStarted,
        startGameCounterIsActive,
        singlePlayer
      } = gameRoomValues;

      const opponentSocketId = Object.keys(playersIsReady).find(key => key !== socket.id);
      setActiveRoomId(roomId)
      setField(fieldGenerator(height, width, 11))
      setGameData({
        points,
        playersIsReady,
        playersLeftTheGame,
        isGameFinish,
        isGameStarted,
        startGameCounterIsActive,
        singlePlayer,
        opponentSocketId,
        pointsToChange: {
          [socket.id]: [],
          ...(opponentSocketId ? {[opponentSocketId]: []} : {})
        },
      })
      setActiveComponent("multiplayerGameRoom")
    })
    socket.on('waiting_room:request_default_game_variants', (waitingRooms: any) => {
      setWaitingRooms(waitingRooms)
    })
    socket.on('waiting_room:single_player_game_room_is_ready', (gameRoomValues: any) => {
      const {
        roomId,
        height,
        width,
        points,
        playersIsReady,
        playersLeftTheGame,
        isGameFinish,
        isGameStarted,
        startGameCounterIsActive,
        singlePlayer
      } = gameRoomValues;

      setActiveRoomId(roomId)
      setField(fieldGenerator(height, width, 11))
      setGameData({
        points,
        playersIsReady,
        playersLeftTheGame,
        isGameFinish,
        isGameStarted,
        startGameCounterIsActive,
        singlePlayer,
        opponentSocketId: '',
        pointsToChange: {
          [socket.id]: []
        },
      })
      setActiveComponent("singlePlayerGameRoom")
    })


    socket.on('game_room:on_position_open_result', ({result, points, isGameFinish, pointsToChange = {}}: any) => {
      setField((field: any) => {
        const fieldCopy = [...field]
        result.forEach((position: any) => fieldCopy[position.y][position.x] = position.count)
        return fieldCopy
      })

      setGameData((gameData: any) => {
        const changeNumber = pointsToChange[socket.id];
        const filteredPoints = (gameData.pointsToChange[socket.id] || [])
          .filter((point: any) => point.createdAt + 1000 > Date.now())
        if (changeNumber) {
          const changedPoints = {
            [socket.id]: [
              ...filteredPoints,
              {value: changeNumber, createdAt: Date.now()}
            ]
          }

          return {
            ...gameData,
            points,
            isGameFinish,
            pointsToChange: {
              ...gameData.pointsToChange,
              ...changedPoints
            },
          }
        }

        if (!gameData.singlePlayer) {
          const opponentChangeNumber = pointsToChange[gameData.opponentSocketId];
          const filteredPoints = (gameData.pointsToChange[gameData.opponentSocketId] || [])
            .filter((point: any) => point.createdAt + 5000 > Date.now())
          if (opponentChangeNumber) {
            const changedPoints = {
              [gameData.opponentSocketId]: [
                ...filteredPoints,
                {value: opponentChangeNumber, createdAt: Date.now()}
              ]
            }

            return {
              ...gameData,
              points,
              isGameFinish,
              pointsToChange: {
                ...gameData.pointsToChange,
                ...changedPoints
              },
            }
          }
        }

        return {
          ...gameData,
          points,
          isGameFinish,
        }
      })
    })
    socket.on('game_room:ready_status_changed', (playersIsReady: any) => {
      setGameData((gameData: any) => ({
        ...gameData,
        playersIsReady,
      }))
    })

    socket.on('game_room:start_game_counter_is_run', () => {
      setGameData((gameData: any) => ({
        ...gameData,
        startGameCounterIsActive: true,
      }))
    })

    socket.on('game_room:start_game', () => {
      setGameData((gameData: any) => ({
        ...gameData,
        startGameCounterIsActive: false,
        isGameStarted: true
      }))
    })

    socket.on('game_room:reset_game', (updatedGameData: any) => {
      setField((field: any) => field.map((row: any) => row.map(() => 11)))
      setGameData((gameData: any) => ({
        ...gameData,
        ...updatedGameData
      }))
    })

    socket.on('game_room:opponent_left', (playersLeftTheGame: any) => {
      setGameData((gameData: any) => ({
        ...gameData,
        playersLeftTheGame
      }))
    })
  }, [isConnected, socket]);

  const setFlagToTheField = ({columnIndex, rowIndex}: any) => {
    setField((field: any) => {

      const fieldCopy = [...field]
      if (fieldCopy[columnIndex][rowIndex] === 11) {
        fieldCopy[columnIndex][rowIndex] = 12
        return fieldCopy
      }
      if (fieldCopy[columnIndex][rowIndex] === 12) {
        fieldCopy[columnIndex][rowIndex] = 11
        return fieldCopy
      }
      return fieldCopy
    })
  }

  const setLoadingCellToTheField = ({columnIndex, rowIndex}: any) => {
    setField((field: any) => {
      const fieldCopy = [...field]
      fieldCopy[columnIndex][rowIndex] = 13
      return fieldCopy
    })
  }

  if (activeComponent === "multiplayerWaitingRoom") {
    return <MultiplayerWaitingRoom
      setActiveComponent={setActiveComponent}
      waitingRooms={waitingRooms}
    />
  }

  if (activeComponent === "singlePlayerWaitingRoom") {
    return <SinglePlayerWaitingRoom
      setActiveComponent={setActiveComponent}
      waitingRooms={waitingRooms}
    />

  }

  if (activeComponent === "multiplayerGameRoom") {
    return <GameField
      field={field}
      setField={setField}
      gameData={gameData}
      roomId={activeRoomId}
      returnToPrevPage={() => setActiveComponent("multiplayerWaitingRoom")}
      setFlagToTheField={setFlagToTheField}
      setLoadingCellToTheField={setLoadingCellToTheField}
    />
  }

  if (activeComponent === "singlePlayerGameRoom") {
    return <GameField
      field={field}
      gameData={gameData}
      roomId={activeRoomId}
      returnToPrevPage={() => setActiveComponent("singlePlayerWaitingRoom")}
      setFlagToTheField={setFlagToTheField}
      setLoadingCellToTheField={setLoadingCellToTheField}
    />
  }


  return (
    <div className={styles.dashboard_wrapper}>
      <div className={styles.dashboard_container}>
        <div className={styles.logo_container}>
          <div className={styles.image_container}>
            <Image
              src="/mine.png"
              fill
              style={{objectFit: "contain"}}
              alt="Picture of the author"
              sizes="50%"
              priority={true}
            />
          </div>
          <h1 className={styles.logo_title}>
            Minesweeper game
          </h1>
        </div>

        <div className={styles.content_wrapper}>
          {
            isConnected ?
              <div className={styles.actions_container}>
                <PrimaryButton
                  text={"Single player"}
                  onClick={() => setActiveComponent('singlePlayerWaitingRoom')}
                  disabled={!isConnected}
                />
                <PrimaryButton
                  text={"Multiplayer"}
                  onClick={() => setActiveComponent('multiplayerWaitingRoom')}
                  disabled={!isConnected}
                />
              </div> :
              <Loading/>
          }
          <div className={styles.footer_container}>
            Footer
          </div>
        </div>
      </div>
    </div>
  );
}
