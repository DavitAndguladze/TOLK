import { getReader } from "../platform/auth";
import { getGenerationVersion } from "../db/generation";
import { resolveReaderVersion } from "./reader-version";

const json = (body: unknown, status = 200, headers = {}) => Response.json(body, {
  status, headers: { "Cache-Control": "private, no-store", ...headers },
});

export async function getVersion(_req: Request, context: { params: Promise<{ versionId: string }> }) {
  const reader = await getReader();
  if (!reader) return json({ error: "Sign in to read this Chapter." }, 401);
  const { versionId } = await context.params;
  const { version, pending } = await resolveReaderVersion(reader.id, versionId);
  if (pending) return json({ error: "Chapter is still being prepared." }, 503, { "Retry-After": "2" });
  if (!version) {
    const failed = await getGenerationVersion(reader.id, versionId);
    if (failed?.status === "failed" && failed.readerId === reader.id) return json(failed);
    return json({ error: "Chapter Version not found" }, 404);
  }
  return json(version);
}
