// Hand-written Level 1 excerpt of Chapter 2 for the live demo, reinforcing "advantages" from
// Chapter 1's Chapter Check. Faithful to the real opening (the valley of ashes, the Eckleburg
// billboard) from src/data/gatsby/content.json's gatsby-full-ch2. Demo-only content: reviewed for
// tone and faithfulness, not run through the generator's automated fidelity/vocabulary gates.
//
// Deliberately its OWN standalone Book/Chapter (bookId "gatsby-ch2-demo", chapterNumber 1), not
// Chapter 2 of the real "gatsby" book. completeChapter() looks up `chapters WHERE bookId=X AND
// number=version.chapterNumber+1` to auto-start generation for whatever's next in THAT book - giving
// this excerpt bookId "gatsby"/number 2 was tried and reproducibly broke Chapter 1 completion (it
// triggered a real generation attempt that 404s, since nothing ever resolves that pending job). A
// separate bookId sidesteps that entirely while staying directly reachable for the demo.
import type { Book, Chapter, ChapterCheck, ChapterVersion } from "../types";
import { tokenize } from "./fixtures";

export const demoChapter2Book: Book = {
  id: "gatsby-ch2-demo",
  title: "The Great Gatsby — Chapter 2 preview",
  author: "F. Scott Fitzgerald",
  sourceUrl: "https://www.gutenberg.org/ebooks/64317",
  chapterCount: 1,
};

const ORIGINAL_CH2 = [
  "About halfway between West Egg and New York the motor road hastily joins the railroad and runs beside it for a quarter of a mile, so as to shrink away from a certain desolate area of land.",
  "This is a valley of ashes—a fantastic farm where ashes grow like wheat into ridges and hills and grotesque gardens; where ashes take the forms of houses and chimneys and rising smoke and, finally, with a transcendent effort, of ash-grey men, who move dimly and already crumbling through the powdery air.",
  "Occasionally a line of grey cars crawls along an invisible track, gives out a ghastly creak, and comes to rest, and immediately the ash-grey men swarm up with leaden spades and stir up an impenetrable cloud, which screens their obscure operations from your sight.",
  "But above the grey land and the spasms of bleak dust which drift endlessly over it, you perceive, after a moment, the eyes of Doctor T. J. Eckleburg.",
];

const ROWS: { text: string; orig: number }[] = [
  { text: "Near New York, there is a strange grey valley.", orig: 0 },
  { text: "People call it the valley of ashes.", orig: 1 },
  { text: "Tired men work all day in the grey dust.", orig: 2 },
  { text: "Above it all, two huge eyes watch from an old sign.", orig: 3 },
  { text: "The people here never had the same advantages Nick had.", orig: 3 },
];

export const demoChapter2: Chapter = {
  id: "gatsby-ch2",
  bookId: "gatsby-ch2-demo",
  number: 1,
  title: "Chapter 2 (excerpt)",
  originalText: ORIGINAL_CH2.join(" "),
  keyPoints: [
    { id: "gatsby-ch2-kp1", chapterId: "gatsby-ch2", text: "A grey, ash-covered valley sits between West Egg and New York." },
    { id: "gatsby-ch2-kp2", chapterId: "gatsby-ch2", text: "A huge pair of eyes on an old sign watches over the valley." },
  ],
  complexWords: [{ word: "advantages", meaning: "things that give you a better chance" }],
};

export function demoChapter2Version(): ChapterVersion {
  const sentences = ROWS.map(({ text, orig }, index) => ({ index, text, originalText: ORIGINAL_CH2[orig] }));
  return {
    id: "gatsby-ch2-L1",
    readerId: null,
    bookId: "gatsby-ch2-demo",
    chapterId: "gatsby-ch2",
    chapterNumber: 1,
    level: 1,
    levelScore: 0,
    status: "ready",
    text: ROWS.map((r) => r.text).join(" "),
    sentences,
    tokens: tokenize(ROWS.map((r) => r.text)),
    reinforcedWords: [{ word: "advantages", reinforcement: "context-clue", sentenceIndex: 4 }],
    baselineVersionId: null,
    generatedAt: "2026-10-18T18:00:00Z",
  };
}

export const demoChapter2Check: ChapterCheck = {
  id: "check-gatsby-ch2-L1",
  chapterVersionId: "gatsby-ch2-L1",
  questions: [
    { id: "q1", kind: "key-point", prompt: "What is the valley of ashes like?", keyPointId: "gatsby-ch2-kp1", answerSentenceIndex: 1 },
    { id: "q2", kind: "key-point", prompt: "What watches over the valley?", keyPointId: "gatsby-ch2-kp2", answerSentenceIndex: 3 },
    {
      id: "q3", kind: "complex-word", prompt: "What does 'advantages' mean in this chapter?", word: "advantages",
      choices: ["things that give you a better chance", "old grey signs", "a kind of valley"], answerSentenceIndex: 4,
    },
  ],
};
