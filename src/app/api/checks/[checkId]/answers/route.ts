import { NextResponse } from "next/server";
import { gradeChapterCheck } from "@/comprehension/grade-check";
import { readAloudForAttempt } from "@/comprehension/read-aloud-attempt";
import { AnswerValidationError } from "@/comprehension/record-answers";
import {
  answersStore, checksById, ensureChapterCheck, findMockVersion, gradedReadAloud, holdLevel, keyPointGrader, recordWordBank,
  sessionResults,
} from "@/comprehension/registry";
import { submitCheckAnswers } from "@/comprehension/service";
import { mockChapter } from "@/mocks";
import { consumeReadAloudSummary, getReadAloudSummary } from "@/platform/registry";
import type { Api, ChapterCheckAnswers } from "@/types";
import { flagStore, readerIdOf } from "@/words/registry";
import { chapterEvidence } from "@/words/word-bank";

export async function POST(req: Request, { params }: { params: Promise<{ checkId: string }> }) {
  const { checkId } = await params;
  // checkId is deterministic (`check-${versionId}`); a restart, hot reload, or second worker can
  // wipe checksById, so recover by regenerating rather than failing the Reader's submission.
  const check = checksById.get(checkId) ?? (await ensureChapterCheck(checkId.replace(/^check-/, "")));
  const version = check && findMockVersion(check.chapterVersionId);
  if (!check || !version) return NextResponse.json({ error: "Chapter Check not found" }, { status: 404 });

  // Chapter 1's L1 version (and its check) is shared across every Reader (ADR-0008); key storage
  // by a per-browser session id so one Reader's submission can't overwrite another's.
  const sessionId = readerIdOf(req);
  const storageKey = `${check.id}:${sessionId}`;

  try {
    const submission = (await req.json()) as ChapterCheckAnswers;
    await submitCheckAnswers(check, submission, answersStore, storageKey);
    const answers = (await answersStore.get(storageKey))!;
    const flaggedWords = flagStore.flaggedWords(sessionId, version.id);
    // Only the reading this completion names (comms 0024): a silent reread or a failed save gets null,
    // so the Chapter Check and Flagged Words weigh 90%/10% between them. A retried submission can
    // still match the reading it was first graded with.
    const readAloud = readAloudForAttempt(submission.readAloudStartedAt, [
      await getReadAloudSummary(sessionId, version.id),
      gradedReadAloud.get(storageKey) ?? null,
    ]);

    const session = await gradeChapterCheck(
      { check, chapter: mockChapter, version, answers, readAloud, flaggedWords, readerId: sessionId },
      { keyPointGrader, now: () => new Date() },
    );
    sessionResults.set(storageKey, session);
    if (readAloud) {
      gradedReadAloud.set(storageKey, readAloud);
      await consumeReadAloudSummary(sessionId, readAloud); // spent: the next completion starts without it (#66)
    }
    const evidence = chapterEvidence({ version, check, grading: session.grading, readAloud });

    const res: Api["POST /api/checks/[checkId]/answers"]["res"] = {
      session,
      decision: holdLevel(version.level, session.grading),
      wordBank: recordWordBank(sessionId, evidence),
      nextVersionId: null, // the next Chapter Version is generated in #14
    };
    return NextResponse.json(res);
  } catch (err) {
    if (err instanceof AnswerValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    throw err;
  }
}
