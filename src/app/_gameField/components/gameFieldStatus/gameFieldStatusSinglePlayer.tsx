import {useSocket} from "../../../../../components/providers/socket-provider";
import PrimaryButton from "../../../../../components/buttons/primaryButton";
import Counter from "../counter";
import SecondaryButton from "../../../../../components/buttons/secondaryButton";
import styles from "./gameFieldStatus.module.scss"
import GameFieldStatusWindow from "@/app/_gameField/components/gameFieldStatusWindow";

export default function GameFieldStatusSinglePlayer({gameData, roomId, returnToPrevPage}: any) {
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
  const isGameStart = gameData.isGameStarted;
  const isGameFinish = gameData.isGameFinish;
  const isStartGameCounterIsActive = gameData.startGameCounterIsActive;
  const gameReadyToStart = !isGameFinish && !isStartGameCounterIsActive && !isGameStart;
  const isYouWin = isGameFinish && timer >= 0
  const isYouLost = isGameFinish && timer < 0

  return (
    <>
      <div className={styles.game_field_header_wrapper}>
        <div className={styles.game_field_header_container}>
          <div className={styles.return_block}>
            <PrimaryButton
              text={"Return"}
              onClick={returnToPrevPage}
            />
          </div>
          <div className={styles.time_block}>{formatSeconds(timer)}</div>
        </div>
      </div>

      {
        isGameStart && !isGameFinish ? null :
          <div className={styles.game_field_statuses_container}>
            {
              gameReadyToStart ?
                <GameFieldStatusWindow title={"New game"} description={"Press for start"}>
                  <SecondaryButton text={"Ready"} onClick={onReadyButtonClick}/>
                </GameFieldStatusWindow> :
                isStartGameCounterIsActive ? <Counter/> :
                  isYouWin || isYouLost ?
                    <GameFieldStatusWindow
                      title={isYouWin ? "You win" : isYouLost? "Lucky next time" : ""}
                      description={"Repeat game"}
                    >
                      <SecondaryButton text={"Repeat"} onClick={onReadyButtonClick}/>
                    </GameFieldStatusWindow> : null
            }
          </div>
      }
    </>
  );
}