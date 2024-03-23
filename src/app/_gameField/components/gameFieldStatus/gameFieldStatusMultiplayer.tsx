import {useSocket} from "../../../../../components/providers/socket-provider";
import PrimaryButton from "../../../../../components/buttons/primaryButton";
import styles from "./gameFieldStatus.module.scss"
import GameFieldStatusWindow from "@/app/_gameField/components/gameFieldStatusWindow";
import SecondaryButton from "../../../../../components/buttons/secondaryButton";
import Counter from "@/app/_gameField/components/counter";

export default function GameFieldStatusMultiplayer({gameData, roomId, returnToPrevPage}: any) {
  const {socket}: any = useSocket()

  const onReadyButtonClick = () => {
    socket.emit("game_room:player_is_ready", {
      roomId,
    });
  }

  const formatSeconds = (seconds: any) => {
    const date = new Date(0);
    date.setSeconds(seconds <= 0 ? 0 : seconds);
    return date.toISOString().substring(14, 19);
  }

  const timer = gameData?.points[socket.id] || 0;
  const playerIsReady = gameData.playersIsReady[socket.id];

  const isOpponentReady = gameData.playersIsReady[gameData.opponentSocketId];

  const opponentTimer = gameData.points[gameData.opponentSocketId] || 0;
  const isOpponentLeft = gameData.playersLeftTheGame[gameData.opponentSocketId];
  const isGameFinish = gameData.isGameFinish;
  const isStartGameCounterIsActive = gameData.startGameCounterIsActive;
  const isGameStart = gameData.isGameStarted;

  const gameReadyToStart = !isGameFinish && !isStartGameCounterIsActive && !isGameStart;

  const isYouWin = isGameFinish && timer >= 0 || isGameFinish && timer > opponentTimer
  const isYouLost = isGameFinish && timer < 0 || isGameFinish && timer < opponentTimer
  const isTie = isGameFinish && timer === opponentTimer

  return (
    <>
      <div className={styles.game_field_header_wrapper}>
        <div className={styles.game_field_header_container}>
          <div className={styles.time_block}>{formatSeconds(timer)}</div>
          <div className={styles.return_block}>
            <PrimaryButton
              text={"Return"}
              onClick={returnToPrevPage}
            />
          </div>
          <div className={styles.time_block}>
            {formatSeconds(opponentTimer)}
            {!!isOpponentLeft && <p className={styles.opponent_status}>Opponent left</p>}
          </div>
        </div>
      </div>

      {
        isGameStart && !isGameFinish ? null :
          <div className={"game_field_statuses_container"}>
            {
              isGameStart && !isGameFinish ? null :
                <div className={styles.game_field_statuses_container}>
                  {
                    gameReadyToStart ?
                      <GameFieldStatusWindow
                        title={"New game"}
                        description={playerIsReady ? "Waiting your opponent" : "Press for start"}
                      >
                        <SecondaryButton
                          text={"Ready"}
                          onClick={onReadyButtonClick}
                          rightSideIsActive={isOpponentReady}
                          leftSideIsActive={playerIsReady}
                        />
                      </GameFieldStatusWindow> :
                      isStartGameCounterIsActive ? <Counter/> :
                        isGameFinish ?
                          <GameFieldStatusWindow
                            title={isTie ? "Tie" : isYouWin ? "You win" : isYouLost ? "Lucky next time" : ''}
                            description={isOpponentLeft ? "Opponent left" : playerIsReady ? "Waiting your opponent" : "Repeat game"}
                          >
                            {
                              isOpponentLeft ?
                                <SecondaryButton
                                  text={"Return"}
                                  onClick={returnToPrevPage}
                                /> :
                                <SecondaryButton
                                  text={"Repeat"}
                                  onClick={onReadyButtonClick}
                                  rightSideIsActive={isOpponentReady}
                                  leftSideIsActive={playerIsReady}
                                />
                            }
                          </GameFieldStatusWindow> : null
                  }
                </div>
            }
          </div>
      }
    </>
  );
}