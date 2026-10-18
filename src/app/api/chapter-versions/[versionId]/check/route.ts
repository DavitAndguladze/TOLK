import { NextResponse } from "next/server";
import { ensureChapterCheck } from "@/comprehension/registry";
import { getChapterCheck, getChapterVersion } from "@/db";
import { getReader } from "@/platform/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  if (process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL) {
    const reader = await getReader();
    if (!reader) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    const version = await getChapterVersion(versionId);
    const check = version?.status === "ready" && (version.readerId === null || version.readerId === reader.id) && await getChapterCheck(version.id);
    return check ? NextResponse.json(check, { headers: { "Cache-Control": "private, no-store" } })
      : NextResponse.json({ error: "Chapter Check not found" }, { status: 404 });
  }
  const check = await ensureChapterCheck(versionId);
  if (!check) return NextResponse.json({ error: "Chapter Version not found" }, { status: 404 });
  return NextResponse.json(check);
}
