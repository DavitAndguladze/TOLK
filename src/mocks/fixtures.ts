// Mock data so every role can build before the real modules land.
// Gatsby (1925) is public domain in the US; L5 below is Fitzgerald's text.
import type {
  Book, Chapter, ChapterCheck, ChapterVersion, Grading, Level, LevelDecision, LevelSpec,
  ProgressView, QuestionGrade, Reader, ReinforcedWord, Sentence, SessionResult, Token, WordBankEntry,
} from "../types";

export const LEVEL_SPECS: Record<Level, LevelSpec> = {
  1: { level: 1, maxWordRank: 1000, maxSentenceWords: 10, figurativeLanguage: "none", label: "Most simplified" },
  2: { level: 2, maxWordRank: 2000, maxSentenceWords: 14, figurativeLanguage: "light", label: "Simplified" },
  3: { level: 3, maxWordRank: 4000, maxSentenceWords: 18, figurativeLanguage: "some", label: "Halfway there" },
  4: { level: 4, maxWordRank: 8000, maxSentenceWords: 24, figurativeLanguage: "most", label: "Close to the original" },
  5: { level: 5, maxWordRank: null, maxSentenceWords: null, figurativeLanguage: "original", label: "The author's original" },
};

export function tokenize(sentences: string[]): Token[] {
  const tokens: Token[] = [];
  sentences.forEach((sentence, sentenceIndex) => {
    for (const text of sentence.split(/\s+/).filter(Boolean)) {
      tokens.push({ index: tokens.length, text, normalized: text.toLowerCase().replace(/[^a-z0-9']/g, ""), sentenceIndex });
    }
  });
  return tokens;
}

const ORIGINAL = [
  "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.",
  "“Whenever you feel like criticizing any one,” he told me, “just remember that all the people in this world haven't had the advantages that you've had.”",
];

/** Each rewritten sentence points at the original sentence it came from. */
const VERSIONS: Record<Level, { text: string; orig: number }[]> = {
  1: [
    { text: "When I was young, my father gave me advice.", orig: 0 },
    { text: "I still think about it.", orig: 0 },
    { text: "He said, “Do not be quick to judge people.", orig: 1 },
    { text: "Not everyone has had the good things you have had.”", orig: 1 },
  ],
  2: [
    { text: "When I was younger and easier to hurt, my father gave me advice.", orig: 0 },
    { text: "I have thought about it ever since.", orig: 0 },
    { text: "“When you feel like judging someone,” he told me, “remember this.", orig: 1 },
    { text: "Not everyone in this world has had the chances you have had.”", orig: 1 },
  ],
  3: [
    { text: "When I was younger and more easily hurt, my father gave me some advice.", orig: 0 },
    { text: "I have kept thinking about it ever since.", orig: 0 },
    { text: "“Whenever you feel like criticizing someone,” he told me, “just remember this.", orig: 1 },
    { text: "Not everyone in this world has had your advantages.”", orig: 1 },
  ],
  4: [
    { text: "In my younger, more vulnerable years, my father gave me advice I've kept thinking about ever since.", orig: 0 },
    { text: "“Whenever you feel like criticizing anyone,” he told me, “just remember this.", orig: 1 },
    { text: "Not everyone in this world has had the advantages you've had.”", orig: 1 },
  ],
  5: ORIGINAL.map((text, orig) => ({ text, orig })),
};

export const mockBook: Book = {
  id: "gatsby",
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  sourceUrl: "https://www.gutenberg.org/ebooks/64317",
  chapterCount: 9,
};

export const mockChapter: Chapter = {
  id: "gatsby-ch1",
  bookId: "gatsby",
  number: 1,
  title: "Chapter 1",
  originalText: ORIGINAL.join(" "),
  keyPoints: [
    { id: "kp1", chapterId: "gatsby-ch1", text: "Nick's father told him not to criticize other people." },
    { id: "kp2", chapterId: "gatsby-ch1", text: "The reason: other people haven't had the same advantages Nick had." },
    { id: "kp3", chapterId: "gatsby-ch1", text: "Nick has kept thinking about this advice for years." },
  ],
  complexWords: [
    { word: "vulnerable", meaning: "easily hurt or affected" },
    { word: "criticizing", meaning: "pointing out what's wrong with someone" },
    { word: "advantages", meaning: "things that give you a better chance" },
  ],
};

export function mockChapterVersion(level: Level, reinforcedWords: ReinforcedWord[] = []): ChapterVersion {
  const rows = VERSIONS[level];
  const sentences: Sentence[] = rows.map(({ text, orig }, index) => ({ index, text, originalText: ORIGINAL[orig] }));
  return {
    id: `gatsby-ch1-L${level}`,
    readerId: level === 1 ? null : "reader-demo",
    bookId: mockBook.id,
    chapterId: mockChapter.id,
    chapterNumber: 1,
    level,
    levelScore: (level - 1) * 25,
    status: "ready",
    text: rows.map((r) => r.text).join(" "),
    sentences,
    tokens: tokenize(rows.map((r) => r.text)),
    reinforcedWords,
    baselineVersionId: null,
    generatedAt: "2026-10-17T18:00:00Z",
  };
}

export const mockReader: Reader = { id: "reader-demo", name: "Demo Reader", email: "demo@example.com" };

export const mockChapterCheck: ChapterCheck = {
  id: "check-gatsby-ch1-L1",
  chapterVersionId: "gatsby-ch1-L1",
  questions: [
    { id: "q1", kind: "key-point", prompt: "What advice did Nick's father give him?", keyPointId: "kp1", answerSentenceIndex: 2 },
    { id: "q2", kind: "key-point", prompt: "Why does his father say Nick shouldn't judge people?", keyPointId: "kp2", answerSentenceIndex: 3 },
    { id: "q3", kind: "complex-word", prompt: "What does 'judge' mean in this chapter?", word: "judge", choices: ["to decide someone is bad", "to sing loudly", "to forget"], answerSentenceIndex: 2 },
  ],
};

export const mockQuestionGrades: QuestionGrade[] = [
  { questionId: "q1", grade: 2, feedback: "Right: don't be quick to judge people.", rereadSentenceIndex: null, rereadSentence: null },
  {
    questionId: "q2",
    grade: 1,
    feedback: "Close. It's because not everyone had the good things Nick had.",
    rereadSentenceIndex: 3,
    rereadSentence: "Not everyone has had the good things you have had.”",
  },
  { questionId: "q3", grade: 2, feedback: "Yes.", rereadSentenceIndex: null, rereadSentence: null },
];

export const mockGrading: Grading = {
  result: "fully-understood",
  score: 84,
  barelyPassed: true,
  questionGrades: mockQuestionGrades,
  missedWords: [{ word: "advice", source: "read-aloud" }, { word: "quick", source: "flagged" }],
  basis: { readAloudAccuracy: 0.94, checkScore: 5, checkMax: 6, flaggedCount: 1 },
};

export const mockSession: SessionResult = {
  id: "session-1",
  readerId: mockReader.id,
  chapterVersionId: "gatsby-ch1-L1",
  chapterNumber: 1,
  level: 1,
  readAloudMisses: [{ word: "advice", tokenIndex: 8, kind: "mispronounced" }],
  grading: mockGrading,
  completedAt: "2026-10-17T18:10:00Z",
};

export const mockDecision: LevelDecision = {
  from: 1,
  to: 1,
  reason: "barely-passed",
  explanation: "You understood it, just barely. One more chapter at this level to lock it in.",
  reinforcement: "plain",
};

export const mockWordBank: WordBankEntry[] = [
  { word: "advice", source: "wrong", timesSeen: 1, graduated: false, addedInChapter: 1, graduatedInChapter: null },
  { word: "quick", source: "flagged", timesSeen: 1, graduated: false, addedInChapter: 1, graduatedInChapter: null },
  { word: "vulnerable", source: "flagged", timesSeen: 3, graduated: true, addedInChapter: 1, graduatedInChapter: 3 },
];

export const mockProgress: ProgressView = {
  bookId: "gatsby",
  levelLine: [
    { chapterNumber: 1, level: 1, result: "fully-understood" },
    { chapterNumber: 2, level: 2, result: "partly-understood" },
    { chapterNumber: 3, level: 2, result: "fully-understood" },
    { chapterNumber: 4, level: 3, result: null },
  ],
  wordsLearned: { total: 7, thisChapter: ["vulnerable"] },
  wordBank: mockWordBank.filter((w) => !w.graduated),
  streak: { current: 3, longest: 5, lastDay: "2026-10-17" },
};
