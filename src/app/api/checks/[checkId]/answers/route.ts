import { NextResponse } from "next/server";
import { gradeChapterCheck } from "@/comprehension/grade-check";
import { AnswerValidationError } from "@/comprehension/record-answers";
import {
  answersStore, checksById, ensureChapterCheck, findMockVersion, holdLevel, keyPointGrader, recordWordBank, sessionResults,
} from "@/comprehension/registry";
import { submitCheckAnswers } from "@/comprehension/service";
import { mockChapter } from "@/mocks";
import { readerIdFor } from "@/platform/auth";
import type { Api, ChapterCheckAnswers } from "@/types";
import { flagStore } from "@/words/registry";
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
  const sessionId = await readerIdFor(req);
  const storageKey = `${check.id}:${sessionId}`;

  try {
    const submission = (await req.json()) as ChapterCheckAnswers;
    await submitCheckAnswers(check, submission, answersStore, storageKey);
    const answers = (await answersStore.get(storageKey))!;
    const flaggedWords = flagStore.flaggedWords(sessionId, version.id);

    // No read-aloud summary reaches the server yet (waiting on R6's accessor, comms 0011), so the
    // Chapter Check and Flagged Words weigh 90%/10% between them.
    const session = await gradeChapterCheck(
      { check, chapter: mockChapter, version, answers, readAloud: null, flaggedWords, readerId: sessionId },
      { keyPointGrader, now: () => new Date() },
    );
    sessionResults.set(storageKey, session);
    const evidence = chapterEvidence({ version, check, grading: session.grading, readAloud: null });

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
