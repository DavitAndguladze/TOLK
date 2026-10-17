// Mock data so every role can build before the real modules land.
// Gatsby (1925) is public domain in the US; L4 below is Fitzgerald's text.
import type {
  CheckResult, ComprehensionCheck, Level, LeveledPage, LevelPreview, LevelSpec,
  Page, PageSentence, PageToken, ProgressView, Reader, ReaderProfile, Scene, Story,
} from "../types";

export const LEVEL_SPECS: Record<Level, LevelSpec> = {
  1: { level: 1, cefr: "A2", maxWordRank: 1000, maxSentenceWords: 10, label: "Everyday words, short sentences" },
  2: { level: 2, cefr: "B1", maxWordRank: 2000, maxSentenceWords: 14, label: "Common words" },
  3: { level: 3, cefr: "B2", maxWordRank: 5000, maxSentenceWords: 20, label: "Plain modern English" },
  4: { level: 4, cefr: "C1", maxWordRank: null, maxSentenceWords: null, label: "The author's own words" },
  5: { level: 5, cefr: "C2", maxWordRank: null, maxSentenceWords: null, label: "Richer than the original" },
};

export function tokenize(sentences: string[]): PageToken[] {
  const tokens: PageToken[] = [];
  sentences.forEach((sentence, sentenceIndex) => {
    for (const text of sentence.split(/\s+/).filter(Boolean)) {
      tokens.push({
        index: tokens.length,
        text,
        normalized: text.toLowerCase().replace(/[^a-z0-9']/g, ""),
        sentenceIndex,
      });
    }
  });
  return tokens;
}

const ORIGINAL = [
  "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.",
  "“Whenever you feel like criticizing any one,” he told me, “just remember that all the people in this world haven't had the advantages that you've had.”",
];

/** Each Leveled sentence points at the Original sentence it came from (tap-to-see-original). */
const LEVELED_SENTENCES: Record<Level, { text: string; orig: number }[]> = {
  1: [
    { text: "When I was young, my father gave me advice.", orig: 0 },
    { text: "I still think about it.", orig: 0 },
    { text: "He said, \u201cDo not be quick to judge people.", orig: 1 },
    { text: "Not everyone has had the good things you have had.\u201d", orig: 1 },
  ],
  2: [
    { text: "When I was younger and easier to hurt, my father gave me advice.", orig: 0 },
    { text: "I have thought about it ever since.", orig: 0 },
    { text: "\u201cWhen you feel like judging someone,\u201d he told me, \u201cremember this.", orig: 1 },
    { text: "Not everyone in this world has had the chances you have had.\u201d", orig: 1 },
  ],
  3: [
    { text: "In my younger, more vulnerable years, my father gave me advice I've kept thinking about ever since.", orig: 0 },
    { text: "\u201cWhenever you feel like criticizing anyone,\u201d he told me, \u201cjust remember this.", orig: 1 },
    { text: "Not everyone in this world has had the advantages you've had.\u201d", orig: 1 },
  ],
  4: ORIGINAL.map((text, orig) => ({ text, orig })),
  5: [
    { text: "In my callow and more impressionable youth, my father bestowed upon me counsel I have been turning over in my mind ever since.", orig: 0 },
    { text: "\u201cWhenever you feel inclined to censure anyone,\u201d he admonished, \u201csimply recall that not all the people in this world have enjoyed the privileges that you have.\u201d", orig: 1 },
  ],
};

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

export const mockStory: Story = {
  id: "gatsby",
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  sourceUrl: "https://www.gutenberg.org/ebooks/64317",
  originalLevel: 4,
  sceneIds: ["gatsby-s1"],
};

export const mockScene: Scene = {
  id: "gatsby-s1",
  storyId: "gatsby",
  index: 0,
  title: "My father's advice",
  pageIds: ["gatsby-p1"],
  keyPoints: [
    { id: "kp1", sceneId: "gatsby-s1", text: "Nick's father told him not to criticize other people." },
    { id: "kp2", sceneId: "gatsby-s1", text: "The reason: other people haven't had the same advantages Nick had." },
    { id: "kp3", sceneId: "gatsby-s1", text: "Nick has kept thinking about this advice for years." },
  ],
};

export const mockPage: Page = { id: "gatsby-p1", storyId: "gatsby", sceneId: "gatsby-s1", index: 0, isSceneEnd: true };

export function mockLeveledPage(level: Level): LeveledPage {
  const rows = LEVELED_SENTENCES[level];
  const sentences: PageSentence[] = rows.map(({ text, orig }, index) => ({ index, text, originalText: ORIGINAL[orig] }));
  const tokens = tokenize(rows.map((r) => r.text));
  const advice = tokens.find((t) => t.normalized === "advice");
  const longestSentenceWords = Math.max(...rows.map((r) => wordCount(r.text)));
  const cap = LEVEL_SPECS[level].maxSentenceWords;
  const passed = cap === null || longestSentenceWords <= cap;
  return {
    pageId: mockPage.id,
    level,
    isOriginal: level === mockStory.originalLevel,
    text: rows.map((r) => r.text).join(" "),
    sentences,
    tokens,
    practiceWordSlots: advice ? [{ sentenceIndex: advice.sentenceIndex, tokenIndex: advice.index, candidateWords: ["counsel", "guidance"] }] : [],
    validation: { passed, outOfBandRatio: 0, longestSentenceWords, notes: passed ? [] : [`sentence of ${longestSentenceWords} words exceeds cap ${cap}`] },
  };
}

export const mockPreviews: LevelPreview[] = ([1, 2, 3, 4, 5] as Level[]).map((level) => ({
  level,
  isOriginal: level === mockStory.originalLevel,
  text: LEVELED_SENTENCES[level].map((r) => r.text).join(" "),
  label: LEVEL_SPECS[level].label,
}));

export const mockReader: Reader = { id: "reader-demo", name: "Demo Reader", email: "demo@example.com" };

export const mockProfile: ReaderProfile = {
  readerId: mockReader.id,
  currentLevel: 4,
  understoodLevel: 3,
  practiceWords: [
    { word: "counsel", addedAt: "2026-10-17T15:00:00Z", storyIdsSeenIn: ["gatsby"], checkIdsUsedIn: [], mastered: false },
  ],
  bookmark: { storyId: "gatsby", pageId: "gatsby-p1" },
};

export const mockCheck: ComprehensionCheck = {
  id: "check-gatsby-s1-l4",
  sceneId: "gatsby-s1",
  level: 4,
  kind: "inference",
  question: "Nick's father gives him some advice. What do you think he meant by it?",
};

export const mockCheckResult: CheckResult = {
  checkId: mockCheck.id,
  readerId: mockReader.id,
  sceneId: mockScene.id,
  levelReadAt: 4,
  answerTranscript: "He meant don't judge people because they didn't grow up with the same stuff you did.",
  grade: 2,
  feedback: "Exactly. You caught both the advice and the reason behind it.",
  keyPointIdsHit: ["kp1", "kp2"],
  skipped: false,
  disputed: false,
  answeredAt: "2026-10-17T15:05:00Z",
};

export const mockProgress: ProgressView = {
  understoodLevel: 3,
  stories: [
    {
      storyId: "gatsby",
      title: "The Great Gatsby",
      understoodLevel: 3,
      sceneMap: [
        { sceneId: "gatsby-s1", title: mockScene.title, levelReadAt: 4, status: "got-it", checkResult: mockCheckResult, keyPoints: mockScene.keyPoints },
      ],
    },
  ],
  practiceWords: mockProfile.practiceWords,
};
