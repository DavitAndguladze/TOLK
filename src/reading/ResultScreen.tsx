import type { Api, ChapterCheck, ChapterCheckAnswers } from "../types";
import { LevelChange } from "./LevelChange";
import { NextChapter } from "./NextChapter";
import { ScoreCountUp } from "./ScoreCountUp";
import { chapterCheckReview, resultHeadline } from "./result";
import motion from "./ReadingMotion.module.css";
import theme from "./ReadingTheme.module.css";
import { Card } from "./ui/Card";
import Link from "next/link";
import controls from "./ui/DesignSystem.module.css";
import styles from "./ResultScreen.module.css";

export type AnswersResult = Api["POST /api/checks/[checkId]/answers"]["res"];

const SOURCE_LABEL = { "read-aloud": "Read aloud", "chapter-check": "Chapter Check", flagged: "Flagged" } as const;

const GRADED_BY_LABEL = {
  "oci-generative-ai": "Answers graded by OCI Generative AI.",
  "stand-in": "Answers graded by word match (OCI Generative AI was unavailable).",
} as const;

const ENCOURAGEMENT = {
  "fully-understood": "Build on what went well, one Chapter at a time.",
  "partly-understood": "You have something to build on. Review the feedback at your pace.",
  struggled: "Finishing counts. Take your time with the feedback before moving on.",
} as const;

function RereadLink({ versionId, sentenceIndex }: { versionId: string; sentenceIndex: number | null }) {
  if (sentenceIndex === null || !Number.isInteger(sentenceIndex) || sentenceIndex < 0) return null;
  // A document navigation starts a clean, microphone-off reading session, even on this same read route.
  return <a className={styles.reread} href={`/read/${encodeURIComponent(versionId)}?sentence=${sentenceIndex}`}>Reread sentence {sentenceIndex + 1}</a>;
}

/** What the Reader sees after the Chapter Check: the Grading Result, what it rests on, and the next Chapter's Level. */
export function ResultScreen({ result, nextHref, check, answers }: { result: AnswersResult; nextHref: string | null; check?: ChapterCheck; answers?: ChapterCheckAnswers }) {
  const { grading, chapterNumber } = result.session;
  const { decision, wordBank } = result;
  const { readAloudAccuracy, checkScore, checkMax, flaggedCount, gradedBy } = grading.basis;
  const toReview = grading.questionGrades.filter((q) => q.grade < 2);
  const review = chapterCheckReview(result.session, check, answers);
  const hasAnswerContext = check?.chapterVersionId === result.session.chapterVersionId && answers !== undefined;

  return (
    <section aria-live="polite" className={`${theme.surface} mx-auto max-w-xl px-6 pt-8 pb-12`}>
      <header className={styles.completion}>
        <svg aria-hidden="true" viewBox="0 0 200 132" className={styles.book} fill="none">
          <ellipse cx="100" cy="114" rx="68" ry="7" fill="var(--color-glow)" />
          <path d="M100 48C76 33 52 36 30 43v61c25-7 48-4 70 9 22-13 45-16 70-9V43c-22-7-46-10-70 5Z" fill="white" stroke="var(--color-light)" strokeWidth="3" />
          <path d="M100 59C77 47 54 47 28 53l7 56c24-4 46 0 65 12 19-12 41-16 65-12l7-56c-26-6-49-6-72 6Z" fill="var(--color-light)" />
          <path d="M100 60v60" stroke="var(--color-ink)" strokeWidth="3" opacity=".4" />
          <path d="m75 80 17 15 34-35" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {grading.result === "fully-understood" && <g className={styles.sparkles} stroke="var(--color-gold)" strokeWidth="4" strokeLinecap="round"><path d="M100 22V8M70 27l-8-11M130 27l8-11M46 38l-10-4M154 38l10-4" /></g>}
        </svg>
        <p className="text-sm text-fog">Chapter {chapterNumber}</p>
        <h2 className={styles.heading}>Chapter complete</h2>
        <p className={`${styles.result} ${grading.result === "fully-understood" ? styles.understood : ""}`}>{resultHeadline(grading)}</p>
        <p className="mt-3 text-fog">{ENCOURAGEMENT[grading.result]}</p>
      </header>
      {review.total > 0 && (
        <Card className="mt-5 text-center"><p className={styles.checkCount}>{review.fullyCorrect} of {review.total} fully correct</p>{review.partlyCorrect > 0 && <p className="mt-1 text-sm text-fog">{review.partlyCorrect} {review.partlyCorrect === 1 ? "answer was" : "answers were"} partly correct.</p>}{review.scorePercent !== null && <p className="mt-2 text-fog"><strong className="text-ink">{review.scorePercent}%</strong> Chapter Check points, including partial credit</p>}</Card>
      )}

      <Card className={`mt-5 ${motion.scoreCard}`}>
        <p className="text-sm text-fog">Chapter score</p>
        <p className="mt-1 font-book text-4xl font-semibold text-ink">
          <ScoreCountUp score={grading.score} />
          <span aria-hidden="true" className="ml-1 text-sm font-normal text-fog">out of 100</span>
        </p>
      </Card>
      <p className="mt-3 text-sm text-fog">This is an estimate based on this Chapter’s answers{readAloudAccuracy === null ? " and Flagged Words" : ", read-aloud accuracy and Flagged Words"}.</p>

      <Card className="mt-6">
        <p className="text-sm text-fog">Next Chapter</p>
        <LevelChange from={decision.from} to={decision.to} />
        <p className="mt-3">{decision.explanation}</p>
        <p className="mt-3 text-sm text-fog">L1 gives the most support. L5 is the author’s original text. Your Level can change by one step between Chapters, using your last three completed Chapters at this Level.</p>
      </Card>

      <h3 className="mt-8 font-semibold">What this was based on</h3>
      <dl className="mt-2 grid grid-cols-3 gap-2">
        <div className={`rounded-xl bg-white/60 p-3 ${motion.statCard}`}>
          <dt className="text-xs text-fog">Read aloud</dt>
          <dd className="mt-1 text-xl font-semibold">{readAloudAccuracy === null ? "Skipped" : `${Math.round(readAloudAccuracy * 100)}%`}</dd>
        </div>
        <div className={`rounded-xl bg-white/60 p-3 ${motion.statCard}`}>
          <dt className="text-xs text-fog">Chapter Check</dt>
          <dd className="mt-1 text-xl font-semibold">
            {checkScore} of {checkMax}
          </dd>
        </div>
        <div className={`rounded-xl bg-white/60 p-3 ${motion.statCard}`}>
          <dt className="text-xs text-fog">Words flagged</dt>
          <dd className="mt-1 text-xl font-semibold">{flaggedCount}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-fog">{GRADED_BY_LABEL[gradedBy]}</p>

      {hasAnswerContext && review.questions.length > 0 ? (
        <details className="mt-8 rounded-2xl border border-hairline bg-white px-4 py-2">
          <summary className="min-h-11 cursor-pointer content-center font-semibold outline-light focus-visible:outline-2 focus-visible:outline-offset-2">Review answers</summary>
          <ol className="divide-y divide-hairline">
            {review.questions.map((question) => (
              <li key={question.questionId} className="py-4">
                <h3 className="font-semibold">{question.prompt ?? "Question text is unavailable in this view."}</h3>
                <p className="mt-2 text-sm text-fog">Your answer</p>
                <p className="whitespace-pre-wrap break-words">{question.answer === null ? "Your answer is unavailable in this view." : question.answer === "" ? "An empty answer was submitted." : question.answer}</p>
                <p className="mt-3 text-sm font-semibold">{question.grade === 2 ? "Fully correct" : question.grade === 1 ? "Partly correct" : "Not quite"}</p>
                <p className="mt-1">{question.feedback}</p>
                {question.rereadSentence && <blockquote className="mt-3 border-l-4 border-light/40 pl-3 text-sm text-fog">Reread: “{question.rereadSentence}”</blockquote>}
                <RereadLink versionId={result.session.chapterVersionId} sentenceIndex={question.rereadSentenceIndex} />
              </li>
            ))}
          </ol>
        </details>
      ) : toReview.length > 0 && (
        <>
          <h3 className="mt-8 font-semibold">Worth another look</h3>
          <ul className="mt-2 space-y-2">
            {toReview.map((q) => (
              <li key={q.questionId} className="rounded-xl border-l-4 border-gold/70 bg-white/60 px-4 py-3">
                <p>{q.feedback}</p>
                {q.rereadSentence && <p className="mt-1 text-sm text-fog">Reread: “{q.rereadSentence}”</p>}
                <RereadLink versionId={result.session.chapterVersionId} sentenceIndex={q.rereadSentenceIndex} />
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
        <Link href="/" className={`${controls.button} ${controls.secondary} ${controls.fullWidth} mt-3`}>Back to Library</Link>
      </div>
    </section>
  );
}
