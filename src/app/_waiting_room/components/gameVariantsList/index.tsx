import styles from "./gameVariantsList.module.scss"
import Image from "next/image";
import PrimaryButton from "../../../../../components/buttons/primaryButton";

export default function GameVariantsList({
                                           setActiveComponent,
                                           waitingRooms,
                                           socketId,
                                           onRoomClick
                                         }: any) {
  return (
    <div className={styles.list_wrapper}>
      <div className={styles.list_container}>
        <div className={styles.list_items_wrapper}>
          {
            waitingRooms.map((room: any) => {
              const status = room.firstPlayerSocketId === socketId ? "Created!" :
                room.firstPlayerSocketId ? "Join!" : ""
              return (
                <div
                  className={styles.list_item_container}
                  onClick={() => onRoomClick(room.id)}
                  key={room.id}
                >
                  <div>{room.width} X {room.height}</div>
                  <div>{room.difficulty}</div>

                  {
                    !!status &&
                      <>
                          <div className={styles.card_status}>
                            {status}
                          </div>
                        {
                          status === "Created!" && <div className={styles.card_close}>
                                <Image
                                    width={12}
                                    height={12}
                                    src="/cross-icon.svg"
                                    alt={"close button"}/>
                            </div>
                        }
                      </>
                  }
                </div>
              )
            })
          }
        </div>
      </div>
      <div className={styles.list_actions_container}>
        <div className={styles.return_button_wrapper}>
          <PrimaryButton
            text={"Return"}
            onClick={() => setActiveComponent('')}
          />
        </div>
      </div>
    </div>

  )
}