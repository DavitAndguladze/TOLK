import { NextResponse } from "next/server";
import { findMockVersion } from "@/comprehension/registry";
import { mockChapter } from "@/mocks";
import { readerIdFor } from "@/platform/auth";
import type { Api } from "@/types";
import { meaningOf } from "@/words/meaning";
import { flagStore } from "@/words/registry";

type FlagApi = Api["POST /api/chapter-versions/[versionId]/flags"];

export async function POST(req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  const version = findMockVersion(versionId);
  if (!version) return NextResponse.json({ error: "Chapter Version not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Partial<FlagApi["req"]> | null;
  const tokenIndex = body?.tokenIndex;
  const flagged = typeof tokenIndex === "number" ? flagStore.flag(await readerIdFor(req), version, tokenIndex) : null;
  if (!flagged) return NextResponse.json({ error: "No such word in this Chapter Version" }, { status: 400 });

  // Every mock Chapter Version is Chapter 1 until ingestion (#6) lands.
  const res: FlagApi["res"] = { flagged, meaning: meaningOf(flagged.word, mockChapter) };
  return NextResponse.json(res);
}
