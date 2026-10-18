import { NextResponse } from "next/server";
import { AnswerValidationError } from "@/comprehension/record-answers";
import { answersStore, checksById } from "@/comprehension/registry";
import { submitCheckAnswers } from "@/comprehension/service";
import type { ChapterCheckAnswers } from "@/types";

export async function POST(req: Request, { params }: { params: Promise<{ checkId: string }> }) {
  const { checkId } = await params;
  const check = checksById.get(checkId);
  if (!check) return NextResponse.json({ error: "Chapter Check not found" }, { status: 404 });

  try {
    const submission = (await req.json()) as ChapterCheckAnswers;
    const result = await submitCheckAnswers(check, submission, answersStore);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AnswerValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    throw err;
  }
}
