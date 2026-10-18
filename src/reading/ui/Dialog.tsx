"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import styles from "./DesignSystem.module.css";

/** Native modal focus containment, Escape dismissal, inert background and focus restoration. */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby={titleId} onClose={() => { if (open) onClose(); }} className={styles.dialog}>
      <h2 id={titleId} className={styles.dialogTitle}>{title}</h2>
      {children}
      <div className={styles.dialogActions}><Button variant="secondary" onClick={() => ref.current?.close()}>Close</Button></div>
    </dialog>
  );
}
