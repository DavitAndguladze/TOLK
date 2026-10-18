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
 * Complex Words are Chapter-level (the author's original vocabulary) and may not appear in a
 * heavily simplified Chapter Version's rewritten text - that's the point of simplifying. Put
 * words that do appear in this Version first, so the question matches what the Reader actually
 * read whenever possible; a Level too simplified to contain any still falls back to the
 * Chapter's full list (answerSentenceIndex still links correctly via the sentence's originalText).
 */
function prioritizeWordsInVersion(words: ComplexWord[], version: ChapterVersion): ComplexWord[] {
  const present = new Set(version.tokens.map((t) => t.normalized));
  const [inVersion, notInVersion] = [words.filter((w) => present.has(w.word.toLowerCase())), words.filter((w) => !present.has(w.word.toLowerCase()))];
  return [...inVersion, ...notInVersion];
}

/**
 * Deterministic stand-in for the AI gateway's "generate Chapter Check" call: 2-3 Key Point
 * questions, 1-2 Complex Word questions. Real OCI Generative AI swaps in later behind this
 * same signature - keep the shape (not the prose) the thing tests depend on.
 */
export const generateChapterCheck: ChapterCheckGenerator = async (chapter, version) => {
  // Caps at the ticket's 2-3 / 1-2 ranges. A Chapter with fewer Key Points/Complex Words than
  // that (none exist yet - ingestion always provides 3-5 per the spec) degrades to fewer
  // questions rather than throwing; revisit if #04's real ingestion ever produces a sparse Chapter.
  const keyPointCount = Math.min(3, Math.max(2, chapter.keyPoints.length));
  const complexWordCount = Math.min(2, Math.max(1, chapter.complexWords.length));

  const keyPointQuestions = chapter.keyPoints.slice(0, keyPointCount).map((kp, i) => ({
    id: `${version.id}-kp-${i}`,
    kind: "key-point" as const,
    prompt: `What does the chapter say about: ${kp.text}`,
    keyPointId: kp.id,
    answerSentenceIndex: bestMatchingSentence(version.sentences, kp.text),
  }));

  const complexWordQuestions = prioritizeWordsInVersion(chapter.complexWords, version)
    .slice(0, complexWordCount)
    .map((cw, i) => ({
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
