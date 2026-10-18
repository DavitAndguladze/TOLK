import styles from "./DesignSystem.module.css";

/** Pass an amount advanced and a positive total; invalid/missing totals show no progress. */
export function ProgressBar({ value, max, label, showPercent = true }: { value: number; max: number; label: string; showPercent?: boolean }) {
  const validTotal = Number.isFinite(max) && max > 0;
  const total = validTotal ? max : 1;
  const completed = Number.isFinite(value) && validTotal ? Math.min(total, Math.max(0, value)) : 0;
  const fraction = completed / total;
  return (
    <div>
      <div className={styles.progressLabel}><span>{label}</span>{showPercent && <span aria-hidden="true">{Math.round(fraction * 100)}%</span>}</div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed} className={styles.progress}>
        <div className={styles.progressFill} style={{ transform: `scaleX(${fraction})` }} />
      </div>
    </div>
  );
}
