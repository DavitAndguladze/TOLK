import { ORIGINAL_LEVEL, type Book, type ProgressView } from "../types";
import { celebratesOriginal } from "./levelLine";
import { LevelLineChart, RESULT_LABEL, ResultMarker } from "./LevelLineChart";

const SOURCE_LABEL = { wrong: "Missed", flagged: "Flagged" } as const;

export function ProgressScreen({ book, progress }: { book: Book; progress: ProgressView }) {
  const { levelLine, wordsLearned, wordBank } = progress;

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-16">
      <p className="font-book text-[1.0625rem] text-fog italic">{book.title}</p>
      <h1 className="font-book text-[1.75rem] leading-tight font-medium">Your progress</h1>

      {celebratesOriginal(levelLine) && (
        <section className="relative mt-6 overflow-hidden rounded-2xl bg-light p-5 text-white">
          <span aria-hidden className="absolute -top-6 -right-6 size-28 rounded-full bg-glow/40 blur-2xl" />
          <h2 className="font-book text-2xl">Now reading the original</h2>
          <p className="mt-1 text-white/85">This Chapter is {book.author}&rsquo;s own text, word for word.</p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Level Line</h2>
        <p className="mt-1 text-sm text-fog">Each Chapter is written one Level closer to the original.</p>
        <div className="mt-4">
          <LevelLineChart line={levelLine} />
        </div>
        <ol className="mt-4 divide-y divide-hairline border-y border-hairline text-sm">
          {levelLine.map((p) => (
            <li key={p.chapterNumber} className="grid grid-cols-[1.25rem_5.5rem_4.5rem_1fr] items-center gap-2 py-2.5">
              <svg aria-hidden viewBox="0 0 14 14" className="size-3.5">
                <ResultMarker result={p.result} />
              </svg>
              <span className="font-semibold">Chapter {p.chapterNumber}</span>
              <span>{p.level === ORIGINAL_LEVEL ? "Original" : `Level ${p.level}`}</span>
              <span className="text-fog">{RESULT_LABEL[p.result ?? "reading"]}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Words learned</h2>
        <p className="mt-1 text-5xl font-semibold">{wordsLearned.total}</p>
        {wordsLearned.thisChapter.length > 0 && (
          <p className="mt-2 text-fog">
            New this Chapter: <span className="font-book text-lg text-ink">{wordsLearned.thisChapter.join(", ")}</span>
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Word Bank</h2>
        {wordBank.length === 0 ? (
          <p className="mt-2 text-fog">No words to practice right now. Words you miss or flag while reading show up here.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-fog">Your next Chapters bring these words back until they stick.</p>
            <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
              {wordBank.map((entry) => (
                <li key={entry.word} className="flex items-baseline justify-between gap-3 py-3">
                  <span className="font-book text-xl">{entry.word}</span>
                  <span className="text-sm text-fog">
                    {SOURCE_LABEL[entry.source]}, seen {entry.timesSeen === 1 ? "once" : `${entry.timesSeen} times`}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
