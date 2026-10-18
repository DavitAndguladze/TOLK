import type { Chapter } from "../types";

export const NO_MEANING = "No short meaning for this one yet. It's flagged, so you'll meet it again with more help.";

export function meaningOf(word: string, chapter: Pick<Chapter, "complexWords">): string {
  return chapter.complexWords.find((c) => c.word.toLowerCase() === word)?.meaning ?? NO_MEANING;
}
