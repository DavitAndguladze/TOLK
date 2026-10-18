import { describe, expect, it } from "vitest";
import type { Chapter } from "../types";
import type { GeneratedChapter } from "./generator.ts";
import type { IngestedGatsby } from "./ingestion.ts";
import { generateGatsbySeed } from "./seed.ts";

const chapters: Chapter[] = [1, 2, 3, 4].map((number) => ({
  id: `gatsby-ch${number}`, bookId: "gatsby", number, title: `Chapter ${number}`,
  originalText: "Complete source is supplied by ingestion.", keyPoints: [], complexWords: [],
}));
const content: IngestedGatsby = {
  book: { id: "gatsby", title: "The Great Gatsby", author: "F. Scott Fitzgerald", sourceUrl: "https://www.gutenberg.org/ebooks/64317", chapterCount: 9 },
  chapters, policies: {},
};

describe("Gatsby seed output", () => {
  it("covers the normal first Chapter and every fallback needed for Chapters 2-4 without inventing Reader history", async () => {
    const requested: string[] = [];
    const generate = async (chapter: Chapter, level: number) => {
      requested.push(`${chapter.number}:L${level}`);
      return { version: { chapterId: chapter.id, level } } as GeneratedChapter;
    };
    const seed = await generateGatsbySeed(content, {
      generateSharedChapterOne: (chapter) => generate(chapter, 1),
      generatePreGenerated: generate,
    });
    expect(requested).toEqual(["1:L1", "2:L1", "2:L2", "2:L3", "2:L4", "2:L5", "3:L1", "3:L2", "3:L3", "3:L4", "3:L5", "4:L1", "4:L2"]);
    expect(seed.content).toEqual(content);
    expect(seed.fallbacks).toHaveLength(12);
    expect(seed.review).toBe("human-review-required");
    expect(seed).not.toHaveProperty("readers");
    expect(seed).not.toHaveProperty("sessionResults");
  });
});
