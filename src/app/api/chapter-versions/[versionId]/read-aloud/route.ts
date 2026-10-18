import { NextResponse } from "next/server";
import { findMockVersion } from "@/comprehension/registry";
import { ReadAloudValidationError, validateReadAloudSummary } from "@/listening/summary";
import { readerIdFor } from "@/platform/auth";
import { readAloudStore } from "@/platform/registry";
import type { Api } from "@/types";

export async function POST(req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  const version = findMockVersion(versionId);
  if (!version) return NextResponse.json({ error: "Chapter Version not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  try {
    // Accuracy and misses are recomputed from the server's tokens; the client's totals are never trusted.
    await readAloudStore.save(await readerIdFor(req), validateReadAloudSummary(version, body));
  } catch (err) {
    if (err instanceof ReadAloudValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }

  const res: Api["POST /api/chapter-versions/[versionId]/read-aloud"]["res"] = { ok: true };
  return NextResponse.json(res);
}
