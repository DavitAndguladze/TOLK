import type { ChapterVersion, Level } from "../types";

/**
 * One ready Version per Level for the Level selector: the assigned Version always holds its own Level,
 * and otherwise the Reader's own Version beats a shared one. Ordered L1 to L5.
 */
export function levelChoices(versions: readonly ChapterVersion[], assigned: ChapterVersion): ChapterVersion[] {
  const byLevel = new Map<Level, ChapterVersion>();
  for (const version of versions) {
    if (version.status !== "ready" || version.bookId !== assigned.bookId || version.chapterNumber !== assigned.chapterNumber) continue;
    const held = byLevel.get(version.level);
    if (!held || (held.readerId === null && version.readerId !== null)) byLevel.set(version.level, version);
  }
  byLevel.set(assigned.level, assigned);
  return [...byLevel.values()].sort((a, b) => a.level - b.level);
}
