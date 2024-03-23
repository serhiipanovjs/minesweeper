"use client"

import {useEffect} from "react";
import {useSocket} from "../../../components/providers/socket-provider";
import GameFieldStatusSinglePlayer from "@/app/_gameField/components/gameFieldStatus/gameFieldStatusSinglePlayer";
import GameFieldStatusMultiplayer from "@/app/_gameField/components/gameFieldStatus/gameFieldStatusMultiplayer";
import styles from "./gameField.module.scss"
import cln from "classnames";
import React from "react";

// eslint-disable-next-line react/display-name
const MemoizedFieldCell = React.memo(({cellValue}: {cellValue: number}) => {
  return (
    <div
      className={cln(styles.cell_container, {
        [styles.cell_container_open]: cellValue !== 11 && cellValue !== 12 && cellValue !== 13,
        [styles.cell_container_flag]: cellValue === 12,
        [styles.cell_container_loading]: cellValue === 13,
      })}
    >
      <div className={styles.closed_cell}/>
      <div className={cln(styles.open_cell,
        {
          [styles.open_one]: cellValue === 1,
          [styles.open_two]: cellValue === 2,
          [styles.open_three]: cellValue === 3,
          [styles.open_four]: cellValue === 4,
          [styles.open_five]: cellValue === 5,
          [styles.open_six]: cellValue === 6,
          [styles.open_seven]: cellValue === 7,
          [styles.open_eight]: cellValue === 8,
          [styles.open_nine]: cellValue === 9,
          [styles.open_mine]: cellValue === 10,
        })}
      />
      <div className={styles.flag_cell}/>
    </div>
  )
});

export default function GameField({
                                    roomId,
                                    field,
                                    setFlagToTheField,
                                    gameData,
                                    returnToPrevPage,
                                    setLoadingCellToTheField
                                  }: any) {
  const {isConnected, socket}: any = useSocket()

  useEffect(() => {
    return () => {
      if (isConnected) {
        socket.emit("game_room:leave");
      }
    }
  }, [socket, isConnected]);

  const onCellClick = ({columnIndex, rowIndex, cellValue, e}: any) => {

    if (gameData.isGameFinish || !gameData.isGameStarted) {
      e.preventDefault()
      return;
    }

    if (e.type === 'click') {
      if (cellValue !== 11) return;

      setLoadingCellToTheField({columnIndex, rowIndex})
      socket.emit("game_room:on_position_open", {
        roomId,
        columnIndex: 0,
        rowIndex: 0,
      });

    } else if (e.type === 'contextmenu') {
      e.preventDefault()
      setFlagToTheField({columnIndex, rowIndex})
    }
  }

  const isSinglePlayer = gameData.singlePlayer

  return (
    <div className={styles.game_page_container}>
      <div className={styles.game_field_wrapper}>
        <div className={styles.game_field_container}>
          {
            isSinglePlayer ?
              <GameFieldStatusSinglePlayer
                gameData={gameData}
                roomId={roomId}
                returnToPrevPage={returnToPrevPage}
              /> :
              <GameFieldStatusMultiplayer
                gameData={gameData}
                roomId={roomId}
                returnToPrevPage={returnToPrevPage}
              />
          }

          {
            field.map((row: any, columnIndex: any) => <div
              key={columnIndex}
              className={styles.row_container}
            >
              {
                row.map((cellValue: any, rowIndex: number) => {
                  return (
                    <div
                      key={rowIndex}
                      className={styles.cell_wrapper}
                      onClick={(e) => onCellClick({
                        columnIndex,
                        rowIndex,
                        cellValue,
                        e
                      })}
                      onContextMenu={(e) => onCellClick({
                        columnIndex,
                        rowIndex,
                        cellValue,
                        e
                      })}
                    >
                      <MemoizedFieldCell cellValue={cellValue}/>
                    </div>
                  )
                })
              }
            </div>)
          }
        </div>
      </div>
    </div>
  );
}
