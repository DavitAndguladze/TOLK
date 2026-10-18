// The Reader's onboarding picks (#99): Api "GET/PUT /api/reader/preferences".
import type { Api } from "@/types";
import { getReaderPreferences, setReaderPreferences } from "@/db";
import { getReader } from "@/platform/auth";
import { parseReaderPreferences } from "@/platform/reader-preferences";

const noStore = { "Cache-Control": "private, no-store" };

export async function GET() {
  const reader = await getReader();
  if (!reader) return Response.json({ error: "Sign in first" }, { status: 401 });
  const preferences = await getReaderPreferences(reader.id);
  return Response.json(preferences satisfies Api["GET /api/reader/preferences"]["res"], { headers: noStore });
}

export async function PUT(req: Request) {
  const reader = await getReader();
  if (!reader) return Response.json({ error: "Sign in first" }, { status: 401 });
  const preferences = parseReaderPreferences(await req.json().catch(() => null));
  if (!preferences) return Response.json({ error: "Pick at least one Reading Goal and one Favourite Genre" }, { status: 400 });
  await setReaderPreferences(reader.id, preferences);
  return Response.json(preferences satisfies Api["PUT /api/reader/preferences"]["res"], { headers: noStore });
}
