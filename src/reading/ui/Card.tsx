import type { HTMLAttributes } from "react";
import styles from "./DesignSystem.module.css";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`${styles.card} ${className}`} />;
}
