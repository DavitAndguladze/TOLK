import { NextResponse } from "next/server";
import { AnswerValidationError } from "@/comprehension/record-answers";
import { answersStore, checksById, ensureChapterCheck } from "@/comprehension/registry";
import { submitCheckAnswers } from "@/comprehension/service";
import type { ChapterCheckAnswers } from "@/types";

export async function POST(req: Request, { params }: { params: Promise<{ checkId: string }> }) {
  const { checkId } = await params;
  // checkId is deterministic (`check-${versionId}`); a restart, hot reload, or second worker can
  // wipe checksById, so recover by regenerating rather than failing the Reader's submission.
  const check = checksById.get(checkId) ?? (await ensureChapterCheck(checkId.replace(/^check-/, "")));
  if (!check) return NextResponse.json({ error: "Chapter Check not found" }, { status: 404 });

  // Chapter 1's L1 version (and its check) is shared across every Reader (ADR-0008); key storage
  // by a per-browser session id so one Reader's submission can't overwrite another's.
  const sessionId = req.headers.get("x-reader-session") ?? "anonymous";

  try {
    const submission = (await req.json()) as ChapterCheckAnswers;
    const result = await submitCheckAnswers(check, submission, answersStore, `${check.id}:${sessionId}`);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AnswerValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    throw err;
  }
}
