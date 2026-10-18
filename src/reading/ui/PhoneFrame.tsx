import type { ReactNode } from "react";
import styles from "./DesignSystem.module.css";

/** Fixed reading controls anchor to the shell; only the inner viewport scrolls. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return <div className={styles.stage}><div className={styles.frame}><div className={styles.viewport}>{children}</div></div></div>;
}
