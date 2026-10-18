import { NextResponse } from "next/server";
import { generateChapterCheck } from "@/comprehension/chapter-check-generator";
import { chapterCheckCache, checksById } from "@/comprehension/registry";
import { getChapterCheckForVersion } from "@/comprehension/service";
import { mockChapter, mockChapterVersion } from "@/mocks";
import { LEVELS } from "@/types";

// Mock Chapter Versions until #04/#05 land real Book ingestion and a Chapter Version store.
const versions = LEVELS.map((level) => mockChapterVersion(level));

export async function GET(_req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  const version = versions.find((v) => v.id === versionId);
  if (!version) return NextResponse.json({ error: "Chapter Version not found" }, { status: 404 });

  const check = await getChapterCheckForVersion(mockChapter, version, { generate: generateChapterCheck, cache: chapterCheckCache });
  checksById.set(check.id, check);
  return NextResponse.json(check);
}
