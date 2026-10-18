import { NextResponse } from "next/server";
import { ensureChapterCheck } from "@/comprehension/registry";

export async function GET(_req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  const check = await ensureChapterCheck(versionId);
  if (!check) return NextResponse.json({ error: "Chapter Version not found" }, { status: 404 });
  return NextResponse.json(check);
}
