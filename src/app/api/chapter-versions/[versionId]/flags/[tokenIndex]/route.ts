import { NextResponse } from "next/server";
import { flagStore, readerIdOf } from "@/words/registry";

export async function DELETE(req: Request, { params }: { params: Promise<{ versionId: string; tokenIndex: string }> }) {
  const { versionId, tokenIndex } = await params;
  const index = Number(tokenIndex);
  if (!Number.isInteger(index)) return NextResponse.json({ error: "Bad token index" }, { status: 400 });
  flagStore.unflag(readerIdOf(req), versionId, index);
  return NextResponse.json({ ok: true });
}
