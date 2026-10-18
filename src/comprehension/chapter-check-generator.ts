import type { Chapter, ChapterCheck, ChapterVersion, ComplexWord, Sentence } from "../types";

/** The seam Role 4 implements. Role 3's real Chapter generator calls this instead of writing its own questions. */
export type ChapterCheckGenerator = (chapter: Chapter, version: ChapterVersion) => Promise<ChapterCheck>;

const FILLER_CHOICES = ["to decide something quickly", "to speak very loudly"];

/** Picks the sentence whose text shares the most words with `needle`; falls back to the first sentence. */
function bestMatchingSentence(sentences: Sentence[], needle: string): number {
  const words = needle.toLowerCase().match(/[a-z']+/g) ?? [];
  let best = { index: sentences[0]?.index ?? 0, score: -1 };
  for (const sentence of sentences) {
    const haystack = `${sentence.text} ${sentence.originalText}`.toLowerCase();
    const score = words.filter((w) => haystack.includes(w)).length;
    if (score > best.score) best = { index: sentence.index, score };
  }
  return best.index;
}

function complexWordChoices(target: ComplexWord, all: ComplexWord[]): string[] {
  const distractors = all.filter((w) => w.word !== target.word).map((w) => w.meaning);
  return [target.meaning, ...distractors, ...FILLER_CHOICES].slice(0, 3);
}

/**
 * Deterministic stand-in for the AI gateway's "generate Chapter Check" call: 2-3 Key Point
 * questions, 1-2 Complex Word questions. Real OCI Generative AI swaps in later behind this
 * same signature - keep the shape (not the prose) the thing tests depend on.
 */
export const generateChapterCheck: ChapterCheckGenerator = async (chapter, version) => {
  const keyPointCount = Math.min(3, Math.max(2, chapter.keyPoints.length));
  const complexWordCount = Math.min(2, Math.max(1, chapter.complexWords.length));

  const keyPointQuestions = chapter.keyPoints.slice(0, keyPointCount).map((kp, i) => ({
    id: `${version.id}-kp-${i}`,
    kind: "key-point" as const,
    prompt: `What does the chapter say about: ${kp.text}`,
    keyPointId: kp.id,
    answerSentenceIndex: bestMatchingSentence(version.sentences, kp.text),
  }));

  const complexWordQuestions = chapter.complexWords.slice(0, complexWordCount).map((cw, i) => ({
    id: `${version.id}-cw-${i}`,
    kind: "complex-word" as const,
    prompt: `What does '${cw.word}' mean in this chapter?`,
    word: cw.word,
    choices: complexWordChoices(cw, chapter.complexWords),
    answerSentenceIndex: bestMatchingSentence(version.sentences, cw.word),
  }));

  return {
    id: `check-${version.id}`,
    chapterVersionId: version.id,
    questions: [...keyPointQuestions, ...complexWordQuestions],
  };
};
