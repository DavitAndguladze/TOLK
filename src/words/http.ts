import { getChapter, getChapterVersion } from "../db";
import { getReader } from "../platform/auth";
import { meaningOf } from "./meaning";
import { listFlags, removeFlag, saveFlag } from "./mysql-flags";
import { isSpeakableWord } from "./oci-speech";
import { defineWord, synthesizeWord } from "./server";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
type Context = { params: Promise<{ versionId: string; tokenIndex?: string }> };

async function reading(context: Context) {
  const reader = await getReader();
  if (!reader) return json({ error: "Sign in to save words." }, 401);
  const { versionId, tokenIndex } = await context.params;
  const version = await getChapterVersion(versionId);
  if (!version || version.status !== "ready" || (version.readerId !== null && version.readerId !== reader.id)) {
    return json({ error: "Chapter Version not found" }, 404);
  }
  return { reader, version, tokenIndex };
}

function wrongOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin === null) return false;
  try {
    // Caddy forwards to an internal Next URL; use the same public origin as authentication.
    return origin !== new URL(process.env.BETTER_AUTH_URL || req.url).origin;
  } catch { return true; }
}

export async function wordMeaning(_req: Request, context: Context) {
  const access = await reading(context);
  if (access instanceof Response) return access;
  const index = Number(access.tokenIndex);
  if (!/^\d+$/.test(access.tokenIndex ?? "") || !Number.isSafeInteger(index) || !access.version.tokens.some((token) => token.index === index)) {
    return json({ error: "No such word in this Chapter Version" }, 400);
  }
  const chapter = await getChapter(access.version.bookId, access.version.chapterNumber);
  if (!chapter) return json({ error: "Chapter not found" }, 404);
  return json(await defineWord(access.version, index, chapter));
}

export async function speakWord(req: Request) {
  if (!(await getReader())) return json({ error: "Sign in to hear words." }, 401);
  if (wrongOrigin(req)) return json({ error: "Invalid request origin" }, 403);
  const body: unknown = await req.json().catch(() => null);
  const text = body && typeof body === "object" && "text" in body ? body.text : null;
  if (!isSpeakableWord(text)) return json({ error: "Choose one word to hear." }, 400);
  if (!synthesizeWord) return json({ error: "Pronunciation is unavailable. Try again shortly." }, 503);
  try {
    return new Response(await synthesizeWord(text), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, no-store" } });
  } catch {
    return json({ error: "Pronunciation is unavailable. Try again shortly." }, 502);
  }
}

export async function getFlags(_req: Request, context: Context) {
  const access = await reading(context);
  if (access instanceof Response) return access;
  return json({ flags: await listFlags(access.reader.id, access.version.id) });
}

export async function postFlag(req: Request, context: Context) {
  const access = await reading(context);
  if (access instanceof Response) return access;
  if (wrongOrigin(req)) return json({ error: "Invalid request origin" }, 403);
  const body: unknown = await req.json().catch(() => null);
  const index = body && typeof body === "object" && "tokenIndex" in body ? body.tokenIndex : null;
  if (typeof index !== "number" || !Number.isSafeInteger(index)) return json({ error: "Bad token index" }, 400);
  const flagged = await saveFlag(access.reader.id, access.version, index);
  if (!flagged) return json({ error: "No such word in this Chapter Version" }, 400);
  const chapter = await getChapter(access.version.bookId, access.version.chapterNumber);
  return json({ flagged, meaning: meaningOf(flagged.word, chapter ?? { complexWords: [] }) });
}

export async function deleteFlag(req: Request, context: Context) {
  const access = await reading(context);
  if (access instanceof Response) return access;
  if (wrongOrigin(req)) return json({ error: "Invalid request origin" }, 403);
  const index = Number(access.tokenIndex);
  if (!/^\d+$/.test(access.tokenIndex ?? "") || !Number.isSafeInteger(index) || !access.version.tokens.some((token) => token.index === index)) {
    return json({ error: "Bad token index" }, 400);
  }
  await removeFlag(access.reader.id, access.version.id, index);
  return json({ ok: true });
}
