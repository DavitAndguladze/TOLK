// Shared contract between the six roles. Names follow CONTEXT.md.
// Aligned to the Reading App Flow (ADR-0008, ADR-0009).
// Change this file in its own small PR and announce it in team chat.

// ── Content ──────────────────────────────────────────────────────────────

/** Rung on the ladder: L1 most simplified … L5 = the author's original text. */
export type Level = 1 | 2 | 3 | 4 | 5;
export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];
export const ORIGINAL_LEVEL: Level = 5;

/** Targets the chapter generator and validator aim for at each Level. */
export interface LevelSpec {
  level: Level;
  /** Word must rank within the top N most frequent English words; null = author's choice. */
  maxWordRank: number | null;
  /** Max words per sentence; null = the author's sentences. */
  maxSentenceWords: number | null;
  figurativeLanguage: "none" | "light" | "some" | "most" | "original";
  label: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  /** Public-domain source (ADR-0003). */
  sourceUrl: string;
  chapterCount: number;
  coverImageUrl?: string;
}

/** A Book chapter as the author wrote it (L5). */
export interface Chapter {
  id: string;
  bookId: string;
  /** 1-based. */
  number: number;
  title: string;
  originalText: string;
  keyPoints: KeyPoint[];
  complexWords: ComplexWord[];
}

/** A plot point; Chapter Check questions target these. */
export interface KeyPoint {
  id: string;
  chapterId: string;
  text: string;
}

/** One of a Chapter's hardest words, detected before the Reader starts. */
export interface ComplexWord {
  word: string;
  meaning: string;
}

/** One word on screen, the unit Listening scores. */
export interface Token {
  index: number;
  /** As displayed, with punctuation: `years,` */
  text: string;
  /** Lowercase, punctuation stripped, for alignment: `years` */
  normalized: string;
  sentenceIndex: number;
}

export interface Sentence {
  index: number;
  text: string;
  /** The author's sentence this one was rewritten from (tap-to-see-original). */
  originalText: string;
}

export type Reinforcement = "plain" | "context-clue" | "inline-definition";

export interface ReinforcedWord {
  word: string;
  reinforcement: Reinforcement;
  sentenceIndex: number;
}

/** One Chapter rewritten for one Reader at one Level (ADR-0008). */
export interface ChapterVersion {
  id: string;
  /** null = shared version (Chapter 1 at L1, demo fallbacks). */
  readerId: string | null;
  bookId: string;
  chapterId: string;
  chapterNumber: number;
  level: Level;
  /** Distance from the original, 0 (very simplified) – 100 (original). Baseline for the next generation. */
  levelScore: number;
  status: "generating" | "ready" | "failed";
  text: string;
  sentences: Sentence[];
  tokens: Token[];
  reinforcedWords: ReinforcedWord[];
  /** The Chapter Version this was generated from; null for Chapter 1. */
  baselineVersionId: string | null;
  generatedAt: string;
}

/** A page of a physical book, photographed and OCR'd (glasses, P2). No Levels. */
export interface PaperPage {
  id: string;
  readerId: string;
  text: string;
  tokens: Token[];
  createdAt: string;
}

// ── Read-aloud ───────────────────────────────────────────────────────────

export type WordOutcome = "pending" | "correct" | "mispronounced" | "skipped";

/** How one expected word was read, after aligning speech to the text (ADR-0002). */
export interface WordResult {
  tokenIndex: number;
  outcome: WordOutcome;
  heard?: string;
  startMs?: number;
  endMs?: number;
  confidence?: number;
  /** Silence before this word started. */
  hesitationMs: number;
}

export interface ReadAloudMiss {
  word: string;
  tokenIndex: number;
  kind: "mispronounced" | "skipped";
}

export type ListeningEvent =
  | { type: "word"; result: WordResult }
  | { type: "hesitation"; tokenIndex: number; ms: number }
  | { type: "chunk-complete"; summary: ReadAloudSummary }
  | { type: "error"; message: string };

/** Result of reading (part of) a Chapter Version aloud. Merge chunk summaries per Chapter. */
export interface ReadAloudSummary {
  chapterVersionId: string;
  /** Share of tokens read correctly, 0–1. */
  accuracy: number;
  wordResults: WordResult[];
  misses: ReadAloudMiss[];
  startedAt: string;
  endedAt: string;
}

export type ListeningEngine = "oci-realtime" | "web-speech" | "mock";

/** The seam Role 1 implements. Reading UI depends only on this. */
export interface ListeningSource {
  readonly engine: ListeningEngine;
  start(chunk: { chapterVersionId: string; tokens: Token[] }, onEvent: (event: ListeningEvent) => void): Promise<void>;
  stop(): Promise<ReadAloudSummary>;
}

export interface FlaggedWord {
  word: string;
  chapterVersionId: string;
  tokenIndex: number;
  at: string;
}

// ── Chapter Check + grading ──────────────────────────────────────────────

/** 0 = missed, 1 = partial, 2 = got it. */
export type AnswerGrade = 0 | 1 | 2;

export interface CheckQuestion {
  id: string;
  kind: "key-point" | "complex-word";
  prompt: string;
  /** Multiple choice for complex-word questions; open answer otherwise. */
  choices?: string[];
  keyPointId?: string;
  word?: string;
  /** Sentence in this Chapter Version that answers it (link back on a miss). */
  answerSentenceIndex: number;
}

export interface ChapterCheck {
  id: string;
  chapterVersionId: string;
  questions: CheckQuestion[];
}

export interface ChapterCheckAnswers {
  answers: { questionId: string; answer: string; via: "spoken" | "typed" }[];
}

export interface QuestionGrade {
  questionId: string;
  grade: AnswerGrade;
  /** One line, from OCI Generative AI. */
  feedback: string;
  rereadSentenceIndex: number | null;
  /** This Chapter Version's text for rereadSentenceIndex, so feedback can quote it without a second lookup. */
  rereadSentence: string | null;
}

export type GradingResult = "fully-understood" | "partly-understood" | "struggled";

/**
 * Who graded the Key Point answers: OCI Generative AI, or the word-match stand-in that runs when
 * OCI isn't configured or fails. "oci-generative-ai" only if OCI graded every one. Complex Word
 * answers are multiple choice, always graded exactly.
 */
export type KeyPointGradedBy = "oci-generative-ai" | "stand-in";

/** Output of the deterministic grading combiner (pure). */
export interface Grading {
  result: GradingResult;
  /** 0–100: Chapter Check 70% + read-aloud accuracy 20% + flags 10% (Check 90% when no read-aloud). Tunable. */
  score: number;
  barelyPassed: boolean;
  questionGrades: QuestionGrade[];
  missedWords: { word: string; source: "read-aloud" | "chapter-check" | "flagged" }[];
  /** Shown to Reader and judges: what the grade was based on, and who graded the answers. */
  basis: { readAloudAccuracy: number | null; checkScore: number; checkMax: number; flaggedCount: number; gradedBy: KeyPointGradedBy };
}

/** Pure grading combiner input: AI question grades + signals. */
export interface GradingInput {
  questionGrades: QuestionGrade[];
  readAloud: ReadAloudSummary | null;
  flaggedWords: string[];
  complexWordMisses: string[];
  gradedBy: KeyPointGradedBy;
}

export interface SessionResult {
  id: string;
  readerId: string;
  chapterVersionId: string;
  chapterNumber: number;
  level: Level;
  readAloudMisses: ReadAloudMiss[];
  grading: Grading;
  completedAt: string;
}

// ── Level rules + Word Bank (pure) ───────────────────────────────────────

export type LevelReason =
  | "fully-understood" // up one
  | "barely-passed" // same
  | "partly-understood" // same
  | "struggled-hold" // same, score ≥ 35
  | "struggled-down" // down one, score < 35
  | "at-original" // already L5
  | "insufficient-history" // fewer than three qualifying Chapters
  | "sustained-understanding" // three-Chapter average >= 88, up one
  | "sustained-struggle" // three-Chapter average < 35, down one
  | "sustained-hold" // three-Chapter average in [35, 88)
  | "at-simplest"; // already L1

export interface LevelDecision {
  from: Level;
  to: Level;
  reason: LevelReason;
  /** Reader-facing line. */
  explanation: string;
  reinforcement: Reinforcement;
}

export interface WordBankEntry {
  word: string;
  source: "wrong" | "flagged";
  timesSeen: number;
  graduated: boolean;
  addedInChapter: number;
  graduatedInChapter: number | null;
}

export interface WordBankUpdate {
  bank: WordBankEntry[];
  graduatedThisChapter: string[];
  wordsLearnedTotal: number;
}

/** The core pure seam: grading → level → word bank. Most tests live here. */
export interface ChapterOutcome {
  grade(input: GradingInput): Grading;
  /**
   * #41: history includes the just-completed Chapter, oldest first. The storage adapter must
   * scope it to one Reader + Book, since the last actual Level change (even on return to an
   * earlier Level). No history means hold; reinforcement still follows the latest grading.
   */
  decideNextLevel(current: Level, grading: Grading, history?: readonly SessionResult[]): LevelDecision;
  applyToWordBank(
    bank: WordBankEntry[],
    session: SessionResult,
    version: Pick<ChapterVersion, "chapterNumber" | "tokens">,
    flaggedWords: string[],
  ): WordBankUpdate;
}

/** Inputs for writing Chapter N+1 (ADR-0008). */
export interface NextChapterInput {
  original: Chapter;
  baseline: ChapterVersion;
  decision: LevelDecision;
  wordBank: WordBankEntry[];
  graduatedWords: string[];
  readerId: string;
}

export interface ChapterGenerator {
  generate(input: NextChapterInput): Promise<{ version: ChapterVersion; check: ChapterCheck }>;
}

// ── Reader + progress ────────────────────────────────────────────────────

export interface Reader {
  id: string;
  name: string;
  email: string;
}

export interface BookProgress {
  bookId: string;
  currentChapterNumber: number;
  currentLevel: Level;
  currentVersionId: string;
}

export interface Streak {
  current: number;
  longest: number;
  lastDay: string | null;
}

export interface ProgressView {
  bookId: string;
  levelLine: { chapterNumber: number; level: Level; result: GradingResult | null }[];
  wordsLearned: { total: number; thisChapter: string[] };
  wordBank: WordBankEntry[];
  streak: Streak;
}

// ── HTTP contract (Next.js route handlers) ───────────────────────────────

export interface Api {
  "GET /api/library?q": { req: void; res: (Book & { progress: BookProgress | null })[] };
  "POST /api/books/[bookId]/open": { req: void; res: { chapter: Pick<Chapter, "id" | "number" | "title">; version: ChapterVersion } };
  "GET /api/chapter-versions/[versionId]": { req: void; res: ChapterVersion };
  "POST /api/chapter-versions/[versionId]/read-aloud": { req: ReadAloudSummary; res: { ok: true } };
  "POST /api/chapter-versions/[versionId]/flags": { req: { word: string; tokenIndex: number }; res: { flagged: FlaggedWord; meaning: string } };
  "DELETE /api/chapter-versions/[versionId]/flags/[tokenIndex]": { req: void; res: { ok: true } };
  "GET /api/chapter-versions/[versionId]/check": { req: void; res: ChapterCheck };
  "POST /api/checks/[checkId]/answers": { req: ChapterCheckAnswers; res: { session: SessionResult; decision: LevelDecision; wordBank: WordBankUpdate; nextVersionId: string | null } };
  "GET /api/progress?bookId": { req: void; res: ProgressView };
  "POST /api/speech/token": { req: void; res: { token: string; region: string; compartmentId: string; expiresAt: string } };
  "POST /api/tts": { req: { text: string }; res: ArrayBuffer /* audio */ };
  "POST /api/paper-pages": { req: FormData /* image */; res: PaperPage };
}
