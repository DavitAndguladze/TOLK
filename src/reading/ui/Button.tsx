import type { ButtonHTMLAttributes } from "react";
import styles from "./DesignSystem.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({ variant = "primary", loading = false, fullWidth = false, disabled, type = "button", className = "", children, ...props }: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={`${styles.button} ${styles[variant]} ${fullWidth ? styles.fullWidth : ""} ${className}`}>
      {loading && <span aria-hidden="true" className={styles.spinner} />}
      {children}
    </button>
  );
}
