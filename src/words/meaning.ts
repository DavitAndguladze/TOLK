import type { Chapter } from "../types";

export const NO_MEANING = "No short meaning for this one yet. It's flagged, so you'll meet it again with more help.";

/** The Chapter's Complex Word meaning, else NO_MEANING. OCI Generative AI define-in-context slots in between, next in #9. */
export function meaningOf(word: string, chapter: Pick<Chapter, "complexWords">): string {
  return chapter.complexWords.find((c) => c.word.toLowerCase() === word)?.meaning ?? NO_MEANING;
}
