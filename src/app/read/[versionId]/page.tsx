import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterCheck } from "@/comprehension/ui/ChapterCheck";
import { getBook, getChapter, getChapterCheck } from "@/db";
import { resolveReaderVersion } from "@/leveling/reader-version";
import { requireReader } from "@/platform/auth";
import { chunkChapterVersion } from "@/reading/chunk";
import { LevelLadder } from "@/reading/LevelLadder";
import { ReadingWithWords } from "@/words/ReadingWithWords";

export default async function ReadPage({ params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  const reader = await requireReader();
  const { version } = await resolveReaderVersion(reader.id, versionId);
  if (!version) notFound();
  // The stored Check: the check and answers routes read and grade this same one (#76).
  const [book, chapter, check] = await Promise.all([
    getBook(version.bookId), getChapter(version.bookId, version.chapterNumber), getChapterCheck(version.id),
  ]);
  if (!book || !chapter || !check) notFound();

  return (
    <main className="min-h-dvh">
      <header className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto max-w-xl">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-book text-[1.0625rem] text-fog italic">{book.title}</p>
            <Link
              href={`/progress/${version.bookId}`}
              className="-my-3 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-light underline-offset-4 outline-light hover:underline focus-visible:outline-2"
            >
              Progress
            </Link>
          </div>
          <h1 className="font-book text-[1.75rem] leading-tight font-medium">{chapter.title}</h1>
          <LevelLadder current={version.level} />
        </div>
      </header>
      <ReadingWithWords key={`${reader.id}:${version.id}`} chapterVersionId={version.id} readerId={reader.id} chunks={chunkChapterVersion(version)} chapterCheck={<ChapterCheck check={check} />} />
    </main>
  );
}
