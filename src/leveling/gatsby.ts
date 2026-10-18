import type { Book, Chapter } from "../types";

export const GATSBY_BOOK: Book = {
  id: "gatsby-full",
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  sourceUrl: "https://www.gutenberg.org/ebooks/64317",
  chapterCount: 9,
};

export type OriginalChapter = Omit<Chapter, "keyPoints" | "complexWords">;

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
    const originalText = body.slice(heading.index + heading[0].length, headings[index + 1]?.index ?? body.length).trim();
    if (!originalText || originalText.split(/\s+/).length < 1000) throw new Error(`Gatsby Chapter ${index + 1} is incomplete.`);
    return {
      id: `${GATSBY_BOOK.id}-ch${index + 1}`,
      bookId: GATSBY_BOOK.id,
      number: index + 1,
      title: `Chapter ${index + 1}`,
      originalText,
    };
  });
}
