import type { Level } from "../types";
import type { GatsbyChapterGenerator, GeneratedChapter } from "./generator.ts";
import type { IngestedGatsby } from "./ingestion.ts";

export interface GatsbySeed {
  content: IngestedGatsby;
  sharedChapterOne: GeneratedChapter;
  fallbacks: GeneratedChapter[];
  review: "human-review-required";
}

/** Content only. R6 imports this without replacing Reader progress or resetting accounts. */
export async function generateGatsbySeed(
  content: IngestedGatsby,
  generator: Pick<GatsbyChapterGenerator, "generateSharedChapterOne" | "generatePreGenerated">,
  options?: { signal?: AbortSignal },
): Promise<GatsbySeed> {
  const chapters = [1, 2, 3, 4].map((number) => {
    const matches = content.chapters.filter((chapter) => chapter.number === number && chapter.bookId === content.book.id);
    if (matches.length !== 1) throw new Error(`Seed requires exactly one original Chapter ${number}`);
    return matches[0];
  });
  options?.signal?.throwIfAborted();
  const sharedChapterOne = await generator.generateSharedChapterOne(chapters[0], options);
  const fallbacks: GeneratedChapter[] = [];
  for (const chapter of chapters.slice(1)) {
    // The seeded Chapter 3 starts at L1, so Chapter 4 can only remain L1 or reach L2.
    const levels: Level[] = chapter.number === 4 ? [1, 2] : [1, 2, 3, 4, 5];
    for (const level of levels) {
      options?.signal?.throwIfAborted();
      fallbacks.push(await generator.generatePreGenerated(chapter, level, options));
    }
  }
  return { content, sharedChapterOne, fallbacks, review: "human-review-required" };
}
