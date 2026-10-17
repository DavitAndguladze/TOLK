// Shared contract between the six roles. Names follow CONTEXT.md.
// Change this file in its own small PR and announce it in team chat.

// ── Content ──────────────────────────────────────────────────────────────

/** One step on the fixed 5-step vocabulary scale (D18). */
export type Level = 1 | 2 | 3 | 4 | 5;
export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];

/** Rules each Level must satisfy; the leveling validator checks against these. */
export interface LevelSpec {
  level: Level;
  cefr: "A2" | "B1" | "B2" | "C1" | "C2";
  /** Word must rank within the top N most frequent English words; null = no cap. */
  maxWordRank: number | null;
  /** Max words per sentence; null = keep the original sentence length. */
  maxSentenceWords: number | null;
  /** Reader-facing description shown in the Level Picker. */
  label: string;
}

export interface Story {
  id: string;
  title: string;
  author: string;
  /** Public-domain source (ADR-0003). */
  sourceUrl: string;
  /** Level where the untouched source text sits. */
  originalLevel: Level;
  sceneIds: string[];
}

/** A run of Pages ending at a natural pause; Comprehension Checks happen only at Scene ends. */
export interface Scene {
  id: string;
  storyId: string;
  index: number;
  title: string;
  pageIds: string[];
  keyPoints: KeyPoint[];
}

/** A fact the Reader should understand from a Scene; the grading rubric. */
export interface KeyPoint {
  id: string;
  sceneId: string;
  text: string;
}

/** The unit a Reader reads aloud at one time. Level changes only between Pages. */
export interface Page {
  id: string;
  storyId: string;
  sceneId: string;
  /** Position within the Story, 0-based. */
  index: number;
  isSceneEnd: boolean;
}

/** One word on screen, the unit Listening scores. */
export interface PageToken {
  index: number;
  /** As displayed, including punctuation: `years,` */
  text: string;
  /** Lowercase, punctuation stripped, used for alignment: `years` */
  normalized: string;
  sentenceIndex: number;
}

export interface PageSentence {
  index: number;
  text: string;
  /** The same sentence at the Original Level, for tap-to-see-original. */
  originalText: string;
}

/** A position on a Leveled Page where a Practice Word can be woven in (D20). */
export interface PracticeWordSlot {
  sentenceIndex: number;
  tokenIndex: number;
  /** Practice Words that fit here without changing meaning. */
  candidateWords: string[];
}

export interface LevelValidation {
  passed: boolean;
  /** Share of words outside the Level's frequency band, 0–1. */
  outOfBandRatio: number;
  longestSentenceWords: number;
  notes: string[];
}

/** One Page rewritten at one Level; plot, names, and event order are locked. */
export interface LeveledPage {
  pageId: string;
  level: Level;
  isOriginal: boolean;
  text: string;
  sentences: PageSentence[];
  tokens: PageToken[];
  practiceWordSlots: PracticeWordSlot[];
  validation: LevelValidation;
}

/** A photographed page of a physical book; no Levels (glasses, P2). */
export interface PaperPage {
  id: string;
  readerId: string;
  text: string;
  tokens: PageToken[];
  createdAt: string;
}

// ── Listening ────────────────────────────────────────────────────────────

export type WordOutcome = "pending" | "correct" | "substituted" | "skipped";

/** How one expected word was read, after aligning speech to the Page (ADR-0002). */
export interface WordResult {
  tokenIndex: number;
  outcome: WordOutcome;
  /** What the recognizer heard, when it differs. */
  heard?: string;
  startMs?: number;
  endMs?: number;
  confidence?: number;
  /** Silence before this word started. */
  hesitationMs: number;
}

export type ListeningEvent =
  | { type: "word"; result: WordResult }
  /** Reader has been stuck on a word longer than the hesitation threshold (~3s). */
  | { type: "hesitation"; tokenIndex: number; ms: number }
  | { type: "page-complete"; summary: PageReadSummary }
  | { type: "error"; message: string };

/** Fluency data for one Page. Feeds only the Level rule (ADR-0005). */
export interface PageReadSummary {
  pageId: string;
  level: Level;
  /** Share of tokens read correctly, 0–1. */
  accuracy: number;
  wordResults: WordResult[];
  startedAt: string;
  endedAt: string;
}

export type ListeningEngine = "oci-realtime" | "web-speech" | "mock";

/** The seam Role 1 implements. Reading UI depends only on this. */
export interface ListeningSource {
  readonly engine: ListeningEngine;
  start(
    page: { pageId: string; level: Level; tokens: PageToken[] },
    onEvent: (event: ListeningEvent) => void,
  ): Promise<void>;
  /** Stops listening and returns the summary for whatever was read. */
  stop(): Promise<PageReadSummary>;
}

// ── Comprehension ────────────────────────────────────────────────────────

/** 0 = missed, 1 = partial, 2 = got it. */
export type CheckGrade = 0 | 1 | 2;

export interface ComprehensionCheck {
  id: string;
  sceneId: string;
  level: Level;
  kind: "recall" | "inference" | "prediction";
  /** Book-club tone, spoken aloud by TTS (D11). */
  question: string;
}

export interface CheckResult {
  checkId: string;
  readerId: string;
  sceneId: string;
  levelReadAt: Level;
  answerTranscript: string;
  grade: CheckGrade;
  /** One spoken line, never a score (D11). */
  feedback: string;
  keyPointIdsHit: string[];
  skipped: boolean;
  disputed: boolean;
  answeredAt: string;
}

// ── Level engine ─────────────────────────────────────────────────────────

export type LevelChangeReason =
  | "read-smoothly-and-understood" // up
  | "struggled-with-words" // down: accuracy < 90%
  | "missed-the-meaning" // down: last check missed, incl. fluent-but-confused (D26)
  | "reader-choice" // Level Picker
  | "hold"; // no change

export interface LevelDecision {
  from: Level;
  to: Level;
  reason: LevelChangeReason;
  /** Reader-facing line for the level-change moment. */
  explanation: string;
}

/** Input to the pure level rule (D13): up if ≥97% + "got it"; down if <90% or "missed"; ≤1 move per 2 Pages. */
export interface LevelRuleInput {
  current: Level;
  lastPage: PageReadSummary;
  /** Most recent check result since the last Level change, if any. */
  lastCheck?: CheckResult;
  pagesSinceLastChange: number;
  /** Pages left where the auto rule is paused after a Level Picker choice (D19). */
  readerChoicePauseRemaining: number;
}

/** What the Level Picker shows: the upcoming paragraph at every Level. */
export interface LevelPreview {
  level: Level;
  isOriginal: boolean;
  text: string;
  label: string;
}

// ── Reader ───────────────────────────────────────────────────────────────

export interface Reader {
  id: string;
  name: string;
  email: string;
}

export interface PracticeWord {
  word: string;
  addedAt: string;
  storyIdsSeenIn: string[];
  checkIdsUsedIn: string[];
  /** Read correctly in 3 Stories and used once in a spoken answer. */
  mastered: boolean;
}

export interface ReaderProfile {
  readerId: string;
  currentLevel: Level;
  understoodLevel: Level | null;
  practiceWords: PracticeWord[];
  /** Current position, so a returning Reader resumes. */
  bookmark: { storyId: string; pageId: string } | null;
}

/** A sentence on Page N+1 rewritten to include a Practice Word (D20). */
export interface WovenSentence {
  pageId: string;
  sentenceIndex: number;
  practiceWord: string;
  text: string;
  /** "genai" passed validation; "swap" is the deterministic fallback. */
  method: "genai" | "swap";
}

// ── Progress (comprehension-first, ADR-0005) ─────────────────────────────

export interface SceneTile {
  sceneId: string;
  title: string;
  levelReadAt: Level | null;
  status: "got-it" | "partial" | "missed" | "skipped" | "unread";
  checkResult?: CheckResult;
  keyPoints: KeyPoint[];
}

export interface ProgressView {
  understoodLevel: Level | null;
  stories: {
    storyId: string;
    title: string;
    understoodLevel: Level | null;
    sceneMap: SceneTile[];
  }[];
  practiceWords: PracticeWord[];
}

// ── HTTP contract (Next.js route handlers) ───────────────────────────────

export interface Api {
  "GET /api/stories": { req: void; res: Story[] };
  "GET /api/stories/[storyId]": { req: void; res: { story: Story; scenes: Scene[]; pages: Page[] } };
  "GET /api/pages/[pageId]?level": { req: void; res: LeveledPage };
  "GET /api/pages/[pageId]/preview": { req: void; res: LevelPreview[] };
  "POST /api/reading/page-summary": { req: PageReadSummary; res: { decision: LevelDecision; nextPage: LeveledPage | null; sceneCheck: ComprehensionCheck | null } };
  "POST /api/reader/level": { req: { level: Level }; res: ReaderProfile };
  "GET /api/reader/profile": { req: void; res: ReaderProfile };
  "POST /api/checks/[checkId]/answer": { req: { answerTranscript: string; skipped?: boolean }; res: CheckResult };
  "POST /api/checks/[checkId]/dispute": { req: void; res: CheckResult };
  "POST /api/speech/token": { req: void; res: { token: string; region: string; compartmentId: string; expiresAt: string } };
  "POST /api/tts": { req: { text: string }; res: ArrayBuffer /* audio */ };
  "POST /api/practice-words": { req: { word: string }; res: ReaderProfile };
  "POST /api/practice-words/weave": { req: { pageId: string; level: Level; words: string[] }; res: WovenSentence[] };
  "GET /api/progress": { req: void; res: ProgressView };
  "POST /api/paper-pages": { req: FormData /* image */; res: PaperPage };
}
