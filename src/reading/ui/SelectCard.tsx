import type { InputHTMLAttributes } from "react";
import styles from "./DesignSystem.module.css";

type SelectCardProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "title" | "children" | "className"> & {
  type: "radio" | "checkbox";
  title: string;
  description?: string;
  feedback?: "correct" | "incorrect";
};

/** Native radios/checkboxes retain browser keyboard and form behavior. Group radios by name. */
export function SelectCard({ title, description, feedback, ...input }: SelectCardProps) {
  return (
    <label className={styles.selectCard} data-feedback={feedback}>
      <input {...input} />
      <span className={styles.selectText}>
        <span className={styles.selectTitle}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
        {feedback && <span className={styles.feedback}>{feedback === "correct" ? "Correct" : "Try again"}</span>}
      </span>
    </label>
  );
}
