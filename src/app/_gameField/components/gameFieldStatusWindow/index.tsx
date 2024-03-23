import styles from "./gameFieldStatusWindow.module.scss"

export default function GameFieldStatusWindow({title, description, children}: any) {
  return (
    <div className={styles.status_window_wrapper}>
      <h3 className={styles.status_window_title}>
        {title}
      </h3>
      <h6 className={styles.status_window_description}>
        {description}
      </h6>
      {children}
    </div>
  )
}