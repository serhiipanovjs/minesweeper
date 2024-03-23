import styles from "./primaryButton.module.scss"

export default function PrimaryButton({text, onClick, ...props}: any) {
  return (
    <button
      className={styles.primary_button}
      onClick={onClick}
      {...props}
    >
      {text}
    </button>
  )
}