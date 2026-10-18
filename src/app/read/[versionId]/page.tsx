import { notFound } from "next/navigation";
import { LEVELS, type Level } from "@/types";
import { mockBook, mockChapter, mockChapterVersion } from "@/mocks";
import { chunkChapterVersion } from "@/reading/chunk";
import { LevelLadder } from "@/reading/LevelLadder";
import { ReadingScreen } from "@/reading/ReadingScreen";

const versions = LEVELS.map((level) => mockChapterVersion(level));
const hrefs = Object.fromEntries(versions.map((v) => [v.level, `/read/${v.id}`])) as Record<Level, string>;

export default async function ReadPage({ params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  const version = versions.find((v) => v.id === versionId);
  if (!version) notFound();

  return (
    <main className="min-h-dvh">
      <header className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto max-w-xl">
          <p className="font-book text-[1.0625rem] text-fog italic">{mockBook.title}</p>
          <h1 className="font-book text-[1.75rem] leading-tight font-medium">{mockChapter.title}</h1>
          <LevelLadder current={version.level} hrefs={hrefs} />
        </div>
      </header>
      <ReadingScreen
        key={version.id}
        chapterVersionId={version.id}
        chunks={chunkChapterVersion(version)}
        progressHref={`/progress/${version.bookId}`}
      />
    </main>
  );
}
