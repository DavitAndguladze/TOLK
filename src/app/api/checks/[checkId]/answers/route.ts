import { after, NextResponse } from "next/server";
import { completeChapter, CompletionError, generateCompletedChapter } from "@/comprehension/complete-chapter";
import { rememberingKeyPointGrader } from "@/comprehension/answer-grades";
import { completionKey } from "@/comprehension/completion-key";
import { gradeChapterCheck } from "@/comprehension/grade-check";
import { readAloudForAttempt } from "@/comprehension/read-aloud-attempt";
import { AnswerValidationError } from "@/comprehension/record-answers";
import {
  answerGradeStore, answersStore, checksById, completedChecks, ensureChapterCheck, findMockVersion, holdLevel, keyPointGrader, recordWordBank,
  sessionResults,
} from "@/comprehension/registry";
import { submitCheckAnswers } from "@/comprehension/service";
import { mockChapter } from "@/mocks";
import { mockKeyPointGrader } from "@/comprehension/key-point-grader";
import { getReader, readerIdFor } from "@/platform/auth";
import { wrongOrigin } from "@/platform/request-origin";
import { metered } from "@/platform/oci-quota";
import { consumeReadAloudSummary, getReadAloudSummary } from "@/platform/registry";
import type { Api, ChapterCheckAnswers } from "@/types";
import { flagStore } from "@/words/registry";
import { chapterEvidence } from "@/words/word-bank";

export async function POST(req: Request, { params }: { params: Promise<{ checkId: string }> }) {
  if (process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL) {
    const reader = await getReader();
    if (!reader) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    if (wrongOrigin(req)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }
    try {
      const outcome = await completeChapter(reader.id, (await params).checkId, await req.json(), { keyPointGrader: metered(reader.id, keyPointGrader, mockKeyPointGrader), now: () => new Date() });
      after(async () => {
        try { await generateCompletedChapter(outcome); }
        catch (err) { console.warn("Chapter generation could not continue:", err instanceof Error ? err.name : "unknown"); }
      });
      return NextResponse.json(outcome, { headers: { "Cache-Control": "private, no-store" } });
    } catch (err) {
      if (err instanceof CompletionError) return NextResponse.json({ error: err.message }, { status: err.status });
      if (err instanceof AnswerValidationError || err instanceof SyntaxError) return NextResponse.json({ error: "Invalid Chapter Check answers" }, { status: 400 });
      console.warn("Chapter completion could not be saved:", err instanceof Error ? err.name : "unknown");
      return NextResponse.json({ error: "Couldn't save your result. Try again." }, { status: 503 });
    }
  }
  // The existing database-less demo remains separate from authenticated durable completions.
  const { checkId } = await params;
  // checkId is deterministic (`check-${versionId}`); a restart, hot reload, or second worker can
  // wipe checksById, so recover by regenerating rather than failing the Reader's submission.
  const check = checksById.get(checkId) ?? (await ensureChapterCheck(checkId.replace(/^check-/, "")));
  const version = check && findMockVersion(check.chapterVersionId);
  if (!check || !version) return NextResponse.json({ error: "Chapter Check not found" }, { status: 404 });

  // Chapter 1's L1 version (and its check) is shared across every Reader (ADR-0008); key storage
  // by Reader (signed in, or a namespaced per-browser id) so one Reader's submission can't overwrite another's.
  const sessionId = await readerIdFor(req);
  const storageKey = `${check.id}:${sessionId}`;

  try {
    const submission = (await req.json()) as ChapterCheckAnswers;
    // A retry of the same completion (e.g. after a lost response) gets the result it already has,
    // without grading again, spending a reading, or touching the Word Bank twice (comms 0024).
    const key = completionKey(submission);
    const done = completedChecks.get(storageKey);
    if (done?.key === key) return NextResponse.json(done.res);

    await submitCheckAnswers(check, submission, answersStore, storageKey);
    const answers = (await answersStore.get(storageKey))!;
    const flaggedWords = flagStore.flaggedWords(sessionId, version.id);
    // Only the reading this completion names: a silent reread, an abandoned attempt, a failed save or
    // an already-spent reading gets null, so the Chapter Check and Flagged Words weigh 90%/10%.
    const readAloud = readAloudForAttempt(submission.readAloudStartedAt, await getReadAloudSummary(sessionId, version.id));

    const session = await gradeChapterCheck(
      { check, chapter: mockChapter, version, answers, readAloud, flaggedWords, readerId: sessionId },
      { keyPointGrader: rememberingKeyPointGrader(keyPointGrader, answerGradeStore, { readerId: sessionId, checkId: check.id }), now: () => new Date() },
    );
    sessionResults.set(storageKey, session);
    const evidence = chapterEvidence({ version, check, grading: session.grading, readAloud });

    const res: Api["POST /api/checks/[checkId]/answers"]["res"] = {
      session,
      decision: holdLevel(version.level, session.grading),
      wordBank: recordWordBank(sessionId, evidence),
      nextVersionId: null, // the next Chapter Version is generated in #14
    };
    completedChecks.set(storageKey, { key, res });
    // Spent only once the Word Bank has it, so the next completion starts without it (#66).
    if (readAloud) await consumeReadAloudSummary(sessionId, readAloud);
    return NextResponse.json(res);
  } catch (err) {
    if (err instanceof AnswerValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    throw err;
  }
}
