import { NextResponse } from "next/server";
import { CompletionError } from "@/comprehension/complete-chapter";
import { gradeAnswerOnCheck, loadCheckForReader } from "@/comprehension/grade-on-check";
import { createMySqlAnswerGradeStore } from "@/comprehension/mysql-answer-grades";
import { AnswerValidationError } from "@/comprehension/record-answers";
import { answerGradeStore, checksById, ensureChapterCheck, findMockVersion, keyPointGrader } from "@/comprehension/registry";
import { mockChapter } from "@/mocks";
import { getReader, readerIdFor } from "@/platform/auth";
import type { Api } from "@/types";

type Grade = Api["POST /api/checks/[checkId]/questions/[questionId]/grade"];

/** Grades one Chapter Check answer when the Reader presses Check (#97); submitting the Check reuses it. */
export async function POST(req: Request, { params }: { params: Promise<{ checkId: string; questionId: string }> }) {
  const { checkId, questionId } = await params;
  try {
    if (process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL) {
      const reader = await getReader();
      if (!reader) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
      const origin = req.headers.get("origin");
      if (origin && origin !== new URL(process.env.BETTER_AUTH_URL || req.url).origin) {
        return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
      }
      const loaded = await loadCheckForReader(reader.id, checkId);
      const grade: Grade["res"] = await gradeAnswerOnCheck(
        { readerId: reader.id, ...loaded, questionId, entry: (await req.json()) as Grade["req"] },
        { keyPointGrader, store: createMySqlAnswerGradeStore() },
      );
      return NextResponse.json(grade, { headers: { "Cache-Control": "private, no-store" } });
    }
    // The database-less demo grades against the registry's Check, like its answers route.
    const check = checksById.get(checkId) ?? (await ensureChapterCheck(checkId.replace(/^check-/, "")));
    const version = check && findMockVersion(check.chapterVersionId);
    if (!check || !version) return NextResponse.json({ error: "Chapter Check not found" }, { status: 404 });
    const grade: Grade["res"] = await gradeAnswerOnCheck(
      { readerId: await readerIdFor(req), check, chapter: mockChapter, version, questionId, entry: (await req.json()) as Grade["req"] },
      { keyPointGrader, store: answerGradeStore },
    );
    return NextResponse.json(grade, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    if (err instanceof CompletionError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof AnswerValidationError || err instanceof SyntaxError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.warn("Answer could not be graded:", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ error: "Couldn't check your answer. Try again." }, { status: 503 });
  }
}
