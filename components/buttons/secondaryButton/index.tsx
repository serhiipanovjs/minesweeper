import styles from "./secondaryButton.module.scss"
import cln from 'classnames';

export default function SecondaryButton({onClick, text = '', rightSideIsActive, leftSideIsActive}: any) {
  return (
    <button
      onClick={onClick}
      className={cln(styles.secondary_button_wrapper, {
        [styles.button_rightSideIsActive]: rightSideIsActive,
        [styles.button_leftSideIsActive]: leftSideIsActive,
      })}
    >
      <div className={styles.secondary_button_container}>
        {text}
      </div>
    </button>
  )
}
