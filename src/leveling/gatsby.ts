import type { Book, Chapter } from "../types";

export const GATSBY_BOOK: Book = {
  id: "gatsby-excerpts",
  title: "The Great Gatsby (Excerpts)",
  author: "F. Scott Fitzgerald",
  sourceUrl: "https://www.gutenberg.org/ebooks/64317",
  chapterCount: 9,
};

export type OriginalChapter = Omit<Chapter, "keyPoints" | "complexWords">;

const EXCERPT_TARGET_WORDS = 1_000;
const EXCERPT_MIN_WORDS = 800;
const EXCERPT_MAX_WORDS = 1_200;

function openingExcerpt(chapterText: string, chapterNumber: number): string {
  const paragraphs = chapterText
    .replace(/^\s*-{3,}\s*$/gm, "")
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  let excerpt = "";
  let words = 0;
  let lastValidExcerpt = "";
  let lastValidWords = 0;

  for (const paragraph of paragraphs) {
    const candidate = excerpt ? `${excerpt}\n\n${paragraph}` : paragraph;
    const candidateWords = candidate.split(/\s+/).length;
    if (candidateWords > EXCERPT_MAX_WORDS) break;
    excerpt = candidate;
    words = candidateWords;
    if (words >= EXCERPT_MIN_WORDS) {
      lastValidExcerpt = excerpt;
      lastValidWords = words;
    }
    if (words >= EXCERPT_TARGET_WORDS) break;
  }

  if (!lastValidExcerpt) {
    throw new Error(`Gatsby Chapter ${chapterNumber} has no opening paragraph excerpt between ${EXCERPT_MIN_WORDS} and ${EXCERPT_MAX_WORDS} words.`);
  }
  return lastValidExcerpt;
}

/** The pinned Gutenberg edition includes a contents list before its nine original Chapters. */
export function parseGatsby(source: string): OriginalChapter[] {
  const text = source.replace(/\r\n?/g, "\n");
  const start = "*** START OF THE PROJECT GUTENBERG EBOOK THE GREAT GATSBY ***";
  const end = "*** END OF THE PROJECT GUTENBERG EBOOK THE GREAT GATSBY ***";
  const startAt = text.indexOf(start);
  const endAt = text.indexOf(end);
  if (startAt < 0 || endAt <= startAt) throw new Error("Expected the complete Gutenberg Gatsby source.");

  const body = text.slice(startAt + start.length, endAt);
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
  const headings = [...body.matchAll(/^[ \t]*(I|II|III|IV|V|VI|VII|VIII|IX)[ \t]*$/gm)].slice(-9);
  if (headings.length !== 9 || headings.some((heading, index) => heading[1] !== numerals[index])) {
    throw new Error("Gatsby source must contain all nine Chapter headings in order.");
  }

  return headings.map((heading, index) => {
    const chapterText = body.slice(heading.index + heading[0].length, headings[index + 1]?.index ?? body.length).trim();
    if (!chapterText || chapterText.split(/\s+/).length < 1000) throw new Error(`Gatsby Chapter ${index + 1} is incomplete.`);
    const originalText = openingExcerpt(chapterText, index + 1);
    return {
      id: `${GATSBY_BOOK.id}-ch${index + 1}`,
      bookId: GATSBY_BOOK.id,
      number: index + 1,
      title: `Chapter ${index + 1} (excerpt)`,
      originalText,
    };
  });
}
