import { NextResponse } from "next/server";
import { findMockVersion } from "@/comprehension/registry";
import { readerIdFor } from "@/platform/auth";
import type { Api } from "@/types";
import { flagStore } from "@/words/registry";

export async function DELETE(req: Request, { params }: { params: Promise<{ versionId: string; tokenIndex: string }> }) {
  const { versionId, tokenIndex } = await params;
  if (!findMockVersion(versionId)) return NextResponse.json({ error: "Chapter Version not found" }, { status: 404 });
  const index = Number(tokenIndex);
  if (!Number.isInteger(index)) return NextResponse.json({ error: "Bad token index" }, { status: 400 });

  flagStore.unflag(await readerIdFor(req), versionId, index);
  const res: Api["DELETE /api/chapter-versions/[versionId]/flags/[tokenIndex]"]["res"] = { ok: true };
  return NextResponse.json(res);
}
