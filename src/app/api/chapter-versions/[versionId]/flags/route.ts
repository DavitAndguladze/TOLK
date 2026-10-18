import { NextResponse } from "next/server";
import { mockChapter } from "@/mocks";
import type { Api } from "@/types";
import { meaningOf } from "@/words/meaning";
import { findChapterVersion, flagStore, readerIdOf } from "@/words/registry";

type FlagRequest = Api["POST /api/chapter-versions/[versionId]/flags"];

export async function POST(req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  const version = findChapterVersion(versionId);
  if (!version) return NextResponse.json({ error: "Chapter Version not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Partial<FlagRequest["req"]> | null;
  const tokenIndex = body?.tokenIndex;
  const flagged = typeof tokenIndex === "number" ? flagStore.flag(readerIdOf(req), version, tokenIndex) : null;
  if (!flagged) return NextResponse.json({ error: "No such word in this Chapter Version" }, { status: 400 });

  const res: FlagRequest["res"] = { flagged, meaning: meaningOf(flagged.word, mockChapter) };
  return NextResponse.json(res);
}
