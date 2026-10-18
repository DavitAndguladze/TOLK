import styles from "./DesignSystem.module.css";

/** Pass an amount advanced and a positive total; invalid/missing totals show no progress. */
/** `showLabel={false}` hides only the visible caption (the bar keeps its aria-label), for callers that show the count elsewhere. */
export function ProgressBar({ value, max, label, showPercent = true, showLabel = true }: { value: number; max: number; label: string; showPercent?: boolean; showLabel?: boolean }) {
  const validTotal = Number.isFinite(max) && max > 0;
  const total = validTotal ? max : 1;
  const completed = Number.isFinite(value) && validTotal ? Math.min(total, Math.max(0, value)) : 0;
  const fraction = completed / total;
  return (
    <div>
      {(showLabel || showPercent) && <div className={styles.progressLabel}>{showLabel && <span>{label}</span>}{showPercent && <span aria-hidden="true">{Math.round(fraction * 100)}%</span>}</div>}
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed} className={styles.progress}>
        <div className={styles.progressFill} style={{ transform: `scaleX(${fraction})` }} />
      </div>
    </div>
  );
}
