import styles from "./counter.module.scss"
import cln from 'classnames';

export default function Counter() {
  return (
    <div className={styles.counter_wrapper}>
      <div className={cln(styles.counter_container, styles.container_three)}>
        3
      </div>
      <div className={cln(styles.counter_container, styles.container_two)}>
        2
      </div>
      <div className={cln(styles.counter_container, styles.container_one)}>
        1
      </div>
    </div>

  )
}