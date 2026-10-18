import { ORIGINAL_LEVEL, type ProgressView } from "../types";

type LevelLine = ProgressView["levelLine"];

/** "Now reading the original" shows once: on the Chapter where the Reader first reaches L5. */
export function celebratesOriginal(line: LevelLine): boolean {
  const first = line.findIndex((point) => point.level === ORIGINAL_LEVEL);
  return first !== -1 && first === line.length - 1;
}
