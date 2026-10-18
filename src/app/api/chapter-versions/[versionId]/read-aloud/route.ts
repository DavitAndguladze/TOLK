import { NextResponse } from "next/server";
import { findMockVersion } from "@/comprehension/registry";
import { getChapterVersion } from "@/db";
import { ReadAloudValidationError, validateReadAloudSummary } from "@/listening/summary";
import { getReader } from "@/platform/auth";
import { wrongOrigin } from "@/platform/request-origin";
import { readerIdFrom } from "@/platform/reader-id";
import { readAloudStore } from "@/platform/registry";
import type { Api } from "@/types";

export async function POST(req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  const durable = Boolean(process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL);
  const reader = durable ? await getReader() : null;
  if (durable && !reader) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const version = durable ? await getChapterVersion(versionId) : findMockVersion(versionId);
  if (!version || version.status !== "ready" || (durable && version.readerId !== null && version.readerId !== reader!.id)) {
    return NextResponse.json({ error: "Chapter Version not found" }, { status: 404 });
  }
  if (wrongOrigin(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });

  const body = await req.json().catch(() => null);
  try {
    // Accuracy and misses are recomputed from the server's tokens; the client's totals are never trusted.
    await readAloudStore.save(reader?.id ?? readerIdFrom(undefined, req.headers.get("x-reader-session")), validateReadAloudSummary(version, body));
  } catch (err) {
    if (err instanceof ReadAloudValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }

  const res: Api["POST /api/chapter-versions/[versionId]/read-aloud"]["res"] = { ok: true };
  return NextResponse.json(res);
}
