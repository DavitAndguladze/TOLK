import type { Api } from "../types";
import { LevelChange } from "./LevelChange";
import { NextChapter } from "./NextChapter";
import { resultHeadline } from "./result";

export type AnswersResult = Api["POST /api/checks/[checkId]/answers"]["res"];

const SOURCE_LABEL = { "read-aloud": "Read aloud", "chapter-check": "Chapter Check", flagged: "Flagged" } as const;

const GRADED_BY_LABEL = {
  "oci-generative-ai": "Answers graded by OCI Generative AI.",
  "stand-in": "Answers graded by word match (OCI Generative AI was unavailable).",
} as const;

/** What the Reader sees after the Chapter Check: the Grading Result, what it rests on, and the next Chapter's Level. */
export function ResultScreen({ result, nextHref }: { result: AnswersResult; nextHref: string | null }) {
  const { grading, chapterNumber } = result.session;
  const { decision, wordBank } = result;
  const { readAloudAccuracy, checkScore, checkMax, flaggedCount, gradedBy } = grading.basis;
  const toReview = grading.questionGrades.filter((q) => q.grade < 2);

  return (
    <section aria-live="polite" className="mx-auto max-w-xl animate-page-in px-6 pt-8 pb-12">
      <p className="text-sm text-fog">Chapter {chapterNumber} result</p>
      <h2 className="mt-1 font-book text-[2rem] leading-tight">{resultHeadline(grading)}</h2>

      <div className="mt-6 rounded-2xl border border-hairline bg-white/60 px-4 pt-4 pb-4">
        <p className="text-sm text-fog">Next Chapter</p>
        <LevelChange from={decision.from} to={decision.to} />
        <p className="mt-3">{decision.explanation}</p>
      </div>

      <h3 className="mt-8 font-semibold">What this was based on</h3>
      <dl className="mt-2 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white/60 p-3">
          <dt className="text-xs text-fog">Read aloud</dt>
          <dd className="mt-1 text-xl font-semibold">{readAloudAccuracy === null ? "Skipped" : `${Math.round(readAloudAccuracy * 100)}%`}</dd>
        </div>
        <div className="rounded-xl bg-white/60 p-3">
          <dt className="text-xs text-fog">Chapter Check</dt>
          <dd className="mt-1 text-xl font-semibold">
            {checkScore} of {checkMax}
          </dd>
        </div>
        <div className="rounded-xl bg-white/60 p-3">
          <dt className="text-xs text-fog">Words flagged</dt>
          <dd className="mt-1 text-xl font-semibold">{flaggedCount}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-fog">{GRADED_BY_LABEL[gradedBy]}</p>

      {toReview.length > 0 && (
        <>
          <h3 className="mt-8 font-semibold">Worth another look</h3>
          <ul className="mt-2 space-y-2">
            {toReview.map((q) => (
              <li key={q.questionId} className="rounded-xl border-l-4 border-gold/70 bg-white/60 px-4 py-3">
                <p>{q.feedback}</p>
                {q.rereadSentence && <p className="mt-1 text-sm text-fog">Reread: “{q.rereadSentence}”</p>}
              </li>
            ))}
          </ul>
        </>
      )}

      {grading.missedWords.length > 0 && (
        <>
          <h3 className="mt-8 font-semibold">Going into your Word Bank</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {grading.missedWords.map((w) => (
              <li key={`${w.word}-${w.source}`} className="rounded-full border border-gold/50 bg-white/60 px-3 py-1">
                <span className="font-book text-lg">{w.word}</span> <span className="text-sm text-fog">{SOURCE_LABEL[w.source]}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {wordBank.graduatedThisChapter.length > 0 && (
        <p className="mt-6 text-fog">
          Learned this Chapter: <span className="font-book text-lg text-ink">{wordBank.graduatedThisChapter.join(", ")}</span>
        </p>
      )}

      <div className="mt-10">
        <NextChapter versionId={result.nextVersionId} href={nextHref} chapterNumber={chapterNumber} />
      </div>
    </section>
  );
}
