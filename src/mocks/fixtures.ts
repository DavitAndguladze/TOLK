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
  "He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that.",
  "In consequence, I'm inclined to reserve all judgements, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.",
  "The abnormal mind is quick to detect and attach itself to this quality when it appears in a normal person, and so it came about that in college I was unjustly accused of being a politician, because I was privy to the secret griefs of wild, unknown men.",
  "Most of the confidences were unsought— frequently I have feigned sleep, preoccupation, or a hostile levity when I realized by some unmistakable sign that an intimate revelation was quivering on the horizon; for the intimate revelations of young men, or at least the terms in which they express them, are usually plagiaristic and marred by obvious suppressions.",
  "Reserving judgements is a matter of infinite hope.",
  "I am still a little afraid of missing something if I forget that, as my father snobbishly suggested, and I snobbishly repeat, a sense of the fundamental decencies is parcelled out unequally at birth.",
  "And, after boasting this way of my tolerance, I come to the admission that it has a limit.",
  "Conduct may be founded on the hard rock or the wet marshes, but after a certain point I don't care what it's founded on.",
  "When I came back from the East last autumn I felt that I wanted the world to be in uniform and at a sort of moral attention forever; I wanted no more riotous excursions with privileged glimpses into the human heart.",
  "Only Gatsby, the man who gives his name to this book, was exempt from my reaction— Gatsby, who represented everything for which I have an unaffected scorn.",
  "If personality is an unbroken series of successful gestures, then there was something gorgeous about him, some heightened sensitivity to the promises of life, as if he were related to one of those intricate machines that register earthquakes ten thousand miles away.",
  "This responsiveness had nothing to do with that flabby impressionability which is dignified under the name of the “creative temperament”— it was an extraordinary gift for hope, a romantic readiness such as I have never found in any other person and which it is not likely I shall ever find again.",
  "No— Gatsby turned out all right at the end; it is what preyed on Gatsby, what foul dust floated in the wake of his dreams that temporarily closed out my interest in the abortive sorrows and short-winded elations of men.",
];

/** Each rewritten sentence points at the original sentence it came from. */
const VERSIONS: Record<Level, { text: string; orig: number }[]> = {
  1: [
    { text: "When I was young, my father gave me advice.", orig: 0 },
    { text: "I still think about it.", orig: 0 },
    { text: "He said, “Do not be quick to judge people.", orig: 1 },
    { text: "Not everyone has had the good things you have had.”", orig: 1 },
    { text: "He did not say more.", orig: 2 },
    { text: "But we understand each other without many words.", orig: 2 },
    { text: "I knew he meant much more than that.", orig: 2 },
    { text: "So I try not to judge people.", orig: 3 },
    { text: "Because of this, many interesting people talk to me.", orig: 3 },
    { text: "Boring people also talk to me for a long time.", orig: 3 },
    { text: "Troubled people quickly notice a person like me.", orig: 4 },
    { text: "In college, some people said I was a politician.", orig: 4 },
    { text: "That was not fair.", orig: 4 },
    { text: "Wild, strange men told me their secret problems.", orig: 4 },
    { text: "I did not ask for their secrets.", orig: 5 },
    { text: "Often I acted sleepy or busy.", orig: 5 },
    { text: "Sometimes I made a joke to stop them.", orig: 5 },
    { text: "I did this when a secret was coming.", orig: 5 },
    { text: "Young men often tell secrets in borrowed words.", orig: 5 },
    { text: "They also hide important parts.", orig: 5 },
    { text: "Not judging people means always having hope.", orig: 6 },
    { text: "I still fear missing something important.", orig: 7 },
    { text: "My father said this, and I say it too.", orig: 7 },
    { text: "People are born different.", orig: 7 },
    { text: "Some know right from wrong better than others.", orig: 7 },
    { text: "I like to say I am patient with people.", orig: 8 },
    { text: "But my patience has a limit.", orig: 8 },
    { text: "People can act from strong or weak reasons.", orig: 9 },
    { text: "After a point, I do not care why.", orig: 9 },
    { text: "Last autumn I came back from the East.", orig: 10 },
    { text: "I wanted everyone to behave well, always.", orig: 10 },
    { text: "I did not want to see into people's hearts anymore.", orig: 10 },
    { text: "Only Gatsby was different for me.", orig: 11 },
    { text: "This book is named after him.", orig: 11 },
    { text: "Gatsby was everything I really dislike.", orig: 11 },
    { text: "But there was something beautiful about him.", orig: 12 },
    { text: "He felt the promise of life very strongly.", orig: 12 },
    { text: "He noticed every small hope in life.", orig: 12 },
    { text: "This was not weakness or moodiness.", orig: 13 },
    { text: "It was a special gift for hope.", orig: 13 },
    { text: "He was ready to dream like no one else.", orig: 13 },
    { text: "I will probably never meet anyone like him again.", orig: 13 },
    { text: "In the end, Gatsby was all right.", orig: 14 },
    { text: "Bad things around his dreams hurt him.", orig: 14 },
    { text: "For a while, I lost interest in other people's feelings.", orig: 14 },
  ],
  2: [
    { text: "When I was younger and easier to hurt, my father gave me advice.", orig: 0 },
    { text: "I have thought about it ever since.", orig: 0 },
    { text: "“When you feel like judging someone,” he told me, “remember this.", orig: 1 },
    { text: "Not everyone in this world has had the chances you have had.”", orig: 1 },
    { text: "He did not say more, but we understand each other without many words.", orig: 2 },
    { text: "I knew he meant much more than that.", orig: 2 },
    { text: "So I try not to judge people quickly.", orig: 3 },
    { text: "Because of this, many interesting people open up to me.", orig: 3 },
    { text: "Many boring people also talk to me for too long.", orig: 3 },
    { text: "Unusual, troubled people quickly notice when a normal person is like this.", orig: 4 },
    { text: "So in college, some people unfairly called me a politician.", orig: 4 },
    { text: "Wild, unknown men told me their secret sadness.", orig: 4 },
    { text: "I did not ask to hear their secrets.", orig: 5 },
    { text: "Often I pretended to sleep, to be busy, or to joke.", orig: 5 },
    { text: "I did this when I saw a private story was coming.", orig: 5 },
    { text: "Young men usually tell these stories in copied words.", orig: 5 },
    { text: "They also leave out the important parts.", orig: 5 },
    { text: "Not judging people is a way of always keeping hope.", orig: 6 },
    { text: "I am still a little afraid of missing something important.", orig: 7 },
    { text: "My father said it in a proud way, and I say it too.", orig: 7 },
    { text: "People are not born with an equal sense of what is right.", orig: 7 },
    { text: "I have been proud of my patience, but I admit it has a limit.", orig: 8 },
    { text: "People may act from strong or weak reasons.", orig: 9 },
    { text: "After a certain point, I do not care which.", orig: 9 },
    { text: "Last autumn I came back from the East.", orig: 10 },
    { text: "I wanted the whole world to stand still and behave forever.", orig: 10 },
    { text: "I wanted no more wild trips into other people's private lives.", orig: 10 },
    { text: "Only Gatsby, the man this book is named after, was different.", orig: 11 },
    { text: "Yet Gatsby stood for everything I truly dislike.", orig: 11 },
    { text: "Still, there was something wonderful about him.", orig: 12 },
    { text: "He was very sensitive to the promises of life.", orig: 12 },
    { text: "He was like a machine that feels earthquakes far away.", orig: 12 },
    { text: "This was not the weak moodiness that people call artistic.", orig: 13 },
    { text: "It was a rare gift for hope.", orig: 13 },
    { text: "He had a romantic readiness I have never seen in anyone else.", orig: 13 },
    { text: "I will probably never see it again.", orig: 13 },
    { text: "No, Gatsby turned out all right in the end.", orig: 14 },
    { text: "The ugly things around his dreams were the problem.", orig: 14 },
    { text: "For a while, they made me lose interest in people's short sadness and joy.", orig: 14 },
  ],
  3: [
    { text: "When I was younger and more easily hurt, my father gave me some advice.", orig: 0 },
    { text: "I have kept thinking about it ever since.", orig: 0 },
    { text: "“Whenever you feel like criticizing someone,” he told me, “just remember this.", orig: 1 },
    { text: "Not everyone in this world has had your advantages.”", orig: 1 },
    { text: "He didn't say more, but we have always understood each other without many words.", orig: 2 },
    { text: "I knew he meant a lot more than that.", orig: 2 },
    { text: "So I tend to hold back my judgments about people.", orig: 3 },
    { text: "This habit has led many interesting people to open up to me.", orig: 3 },
    { text: "It has also made me the target of many boring people.", orig: 3 },
    { text: "Troubled minds quickly notice this quality in a normal person and hold on to it.", orig: 4 },
    { text: "So in college I was unfairly accused of being a politician.", orig: 4 },
    { text: "That was because wild, unknown men told me their secret sorrows.", orig: 4 },
    { text: "I didn't ask for most of these secrets.", orig: 5 },
    { text: "Often I pretended to sleep, to be busy, or to joke unkindly.", orig: 5 },
    { text: "I did this whenever I sensed that a private confession was about to come.", orig: 5 },
    { text: "Young men's confessions usually borrow other people's words and hide the important parts.", orig: 5 },
    { text: "Holding back judgment is a matter of endless hope.", orig: 6 },
    { text: "I'm still a little afraid of missing something if I forget this.", orig: 7 },
    { text: "My father said it a little snobbishly, and I repeat it.", orig: 7 },
    { text: "A sense of basic decency isn't given out equally at birth.", orig: 7 },
    { text: "After boasting about my tolerance like this, I have to admit it has a limit.", orig: 8 },
    { text: "People's behavior may rest on solid rock or on wet marshes.", orig: 9 },
    { text: "After a certain point, I don't care what it rests on.", orig: 9 },
    { text: "When I came back from the East last autumn, I wanted the world in uniform.", orig: 10 },
    { text: "I wanted everyone standing at moral attention forever.", orig: 10 },
    { text: "I wanted no more wild trips with special looks into the human heart.", orig: 10 },
    { text: "Only Gatsby, the man this book is named after, was free from my reaction.", orig: 11 },
    { text: "Yet Gatsby represented everything I openly scorn.", orig: 11 },
    { text: "If personality is a series of successful gestures, there was something gorgeous about him.", orig: 12 },
    { text: "He was highly sensitive to the promises of life.", orig: 12 },
    { text: "It was as if he were connected to machines that sense earthquakes thousands of miles away.", orig: 12 },
    { text: "This sensitivity had nothing to do with the weak moodiness people call the creative temperament.", orig: 13 },
    { text: "It was an extraordinary gift for hope.", orig: 13 },
    { text: "It was a romantic readiness I have never found in anyone else, and probably never will.", orig: 13 },
    { text: "No, Gatsby turned out all right in the end.", orig: 14 },
    { text: "It was what preyed on him, the foul dust that followed his dreams.", orig: 14 },
    { text: "That made me lose interest, for a while, in people's failed sorrows and short-lived joys.", orig: 14 },
  ],
  4: [
    { text: "In my younger, more vulnerable years, my father gave me advice I've kept thinking about ever since.", orig: 0 },
    { text: "“Whenever you feel like criticizing anyone,” he told me, “just remember this.", orig: 1 },
    { text: "Not everyone in this world has had the advantages you've had.”", orig: 1 },
    { text: "He didn't say any more, but we've always communicated well in a reserved way, and I understood he meant much more than that.", orig: 2 },
    { text: "As a result, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me.", orig: 3 },
    { text: "It has also made me the victim of quite a few veteran bores.", orig: 3 },
    { text: "The abnormal mind quickly detects this quality in a normal person and attaches itself to it.", orig: 4 },
    { text: "So in college I was unjustly accused of being a politician, because wild, unknown men shared their secret griefs with me.", orig: 4 },
    { text: "Most of their confidences were unsought.", orig: 5 },
    { text: "Often I faked sleep, distraction, or hostile humor when some clear sign told me an intimate revelation was quivering on the horizon.", orig: 5 },
    { text: "Young men's revelations, or at least the words they use, are usually borrowed and marred by obvious omissions.", orig: 5 },
    { text: "Reserving judgments is a matter of infinite hope.", orig: 6 },
    { text: "I'm still a little afraid of missing something if I forget that a sense of the fundamental decencies is unequally given at birth.", orig: 7 },
    { text: "My father suggested this snobbishly, and I snobbishly repeat it.", orig: 7 },
    { text: "And, after boasting this way about my tolerance, I come to the admission that it has a limit.", orig: 8 },
    { text: "Conduct may be founded on hard rock or wet marshes, but after a certain point I don't care what it's founded on.", orig: 9 },
    { text: "When I came back from the East last autumn, I wanted the world in uniform and at a sort of moral attention forever.", orig: 10 },
    { text: "I wanted no more riotous excursions with privileged glimpses into the human heart.", orig: 10 },
    { text: "Only Gatsby, the man who gives his name to this book, was exempt from my reaction.", orig: 11 },
    { text: "Yet Gatsby represented everything for which I have an unaffected scorn.", orig: 11 },
    { text: "If personality is an unbroken series of successful gestures, then there was something gorgeous about him.", orig: 12 },
    { text: "He had a heightened sensitivity to the promises of life, as if related to machines that register earthquakes ten thousand miles away.", orig: 12 },
    { text: "This responsiveness had nothing to do with the flabby impressionability that people dignify as the creative temperament.", orig: 13 },
    { text: "It was an extraordinary gift for hope, a romantic readiness I have never found in anyone else and probably never shall again.", orig: 13 },
    { text: "No, Gatsby turned out all right at the end.", orig: 14 },
    { text: "It was what preyed on Gatsby, the foul dust that floated in the wake of his dreams, that closed out my interest.", orig: 14 },
    { text: "For a while I lost interest in the abortive sorrows and short-winded elations of men.", orig: 14 },
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
    { word: "judge", meaning: "to decide someone is bad" },
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

/** Same two Key Points and a level-appropriate vocabulary question, one Check per Level 2-5 (L1 is mockChapterCheck above). */
const CHECKS_BY_LEVEL: Record<Exclude<Level, 1>, ChapterCheck> = {
  2: {
    id: "check-gatsby-ch1-L2",
    chapterVersionId: "gatsby-ch1-L2",
    questions: [
      { id: "q1", kind: "key-point", prompt: "What advice did Nick's father give him?", keyPointId: "kp1", answerSentenceIndex: 2 },
      { id: "q2", kind: "key-point", prompt: "Why does his father say Nick shouldn't judge people?", keyPointId: "kp2", answerSentenceIndex: 3 },
      { id: "q3", kind: "complex-word", prompt: "What does 'judging' mean in this chapter?", word: "judging", choices: ["the act of deciding someone is bad", "to sing loudly", "to forget"], answerSentenceIndex: 2 },
    ],
  },
  3: {
    id: "check-gatsby-ch1-L3",
    chapterVersionId: "gatsby-ch1-L3",
    questions: [
      { id: "q1", kind: "key-point", prompt: "What advice did Nick's father give him?", keyPointId: "kp1", answerSentenceIndex: 2 },
      { id: "q2", kind: "key-point", prompt: "Why does his father say Nick shouldn't judge people?", keyPointId: "kp2", answerSentenceIndex: 3 },
      { id: "q3", kind: "complex-word", prompt: "What does 'criticizing' mean in this chapter?", word: "criticizing", choices: ["pointing out what's wrong with someone", "to sing loudly", "to forget"], answerSentenceIndex: 2 },
    ],
  },
  4: {
    id: "check-gatsby-ch1-L4",
    chapterVersionId: "gatsby-ch1-L4",
    questions: [
      { id: "q1", kind: "key-point", prompt: "What advice did Nick's father give him?", keyPointId: "kp1", answerSentenceIndex: 1 },
      { id: "q2", kind: "key-point", prompt: "Why does his father say Nick shouldn't judge people?", keyPointId: "kp2", answerSentenceIndex: 2 },
      { id: "q3", kind: "complex-word", prompt: "What does 'vulnerable' mean in this chapter?", word: "vulnerable", choices: ["easily hurt or affected", "to sing loudly", "to forget"], answerSentenceIndex: 0 },
    ],
  },
  5: {
    id: "check-gatsby-ch1-L5",
    chapterVersionId: "gatsby-ch1-L5",
    questions: [
      { id: "q1", kind: "key-point", prompt: "What advice did Nick's father give him?", keyPointId: "kp1", answerSentenceIndex: 1 },
      { id: "q2", kind: "key-point", prompt: "Why does his father say Nick shouldn't judge people?", keyPointId: "kp2", answerSentenceIndex: 1 },
      { id: "q3", kind: "complex-word", prompt: "What does 'advantages' mean in this chapter?", word: "advantages", choices: ["things that give you a better chance", "to sing loudly", "to forget"], answerSentenceIndex: 1 },
    ],
  },
};

/** The Chapter Check for any Level of the demo Chapter (gatsby-ch1): L1 reuses mockChapterCheck, L2-L5 are hand-authored to match VERSIONS. */
export function mockChapterCheckFor(level: Level): ChapterCheck {
  return level === 1 ? mockChapterCheck : CHECKS_BY_LEVEL[level];
}

export const mockChapterCheckL2 = CHECKS_BY_LEVEL[2];
export const mockChapterCheckL3 = CHECKS_BY_LEVEL[3];
export const mockChapterCheckL4 = CHECKS_BY_LEVEL[4];
export const mockChapterCheckL5 = CHECKS_BY_LEVEL[5];

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
  basis: { readAloudAccuracy: 0.94, checkScore: 5, checkMax: 6, flaggedCount: 1, gradedBy: "oci-generative-ai" },
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
