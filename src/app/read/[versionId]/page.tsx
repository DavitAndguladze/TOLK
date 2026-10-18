import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureChapterCheck, mockVersions } from "@/comprehension/registry";
import { ChapterCheck } from "@/comprehension/ui/ChapterCheck";
import type { Level } from "@/types";
import { mockBook, mockChapter } from "@/mocks";
import { chunkChapterVersion } from "@/reading/chunk";
import { LevelLadder } from "@/reading/LevelLadder";
import { ReadingScreen } from "@/reading/ReadingScreen";

const hrefs = Object.fromEntries(mockVersions.map((v) => [v.level, `/read/${v.id}`])) as Record<Level, string>;

export default async function ReadPage({ params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  const version = mockVersions.find((v) => v.id === versionId);
  if (!version) notFound();

  // Generated alongside the Chapter Version, not when the Reader finishes reading, so the
  // Chapter Check has no spinner later (spec: "generated when the Chapter Version is generated").
  const check = await ensureChapterCheck(version.id);
  if (!check) notFound();

  return (
    <main className="min-h-dvh">
      <header className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto max-w-xl">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-book text-[1.0625rem] text-fog italic">{mockBook.title}</p>
            <Link
              href={`/progress/${version.bookId}`}
              className="-my-3 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-light underline-offset-4 outline-light hover:underline focus-visible:outline-2"
            >
              Progress
            </Link>
          </div>
          <h1 className="font-book text-[1.75rem] leading-tight font-medium">{mockChapter.title}</h1>
          <LevelLadder current={version.level} hrefs={hrefs} />
        </div>
      </header>
      <ReadingScreen key={version.id} chapterVersionId={version.id} chunks={chunkChapterVersion(version)} chapterCheck={<ChapterCheck check={check} />} />
    </main>
  );
}
