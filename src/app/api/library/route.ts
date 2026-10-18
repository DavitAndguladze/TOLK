// The Library as JSON (#7): Api "GET /api/library?q".
import type { NextRequest } from "next/server";
import type { Api } from "@/types";
import { listLibrary } from "@/db";
import { getReader } from "@/platform/auth";

export async function GET(req: NextRequest) {
  const reader = await getReader();
  if (!reader) return Response.json({ error: "Sign in first" }, { status: 401 });
  const books = await listLibrary(reader.id, req.nextUrl.searchParams.get("q") ?? "");
  return Response.json(books satisfies Api["GET /api/library?q"]["res"]);
}
