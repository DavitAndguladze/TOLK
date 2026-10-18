import { getChapterVersion } from "../db";
import { resolveGeneration } from "../db/generation";

/** Pending links keep their identity; reading and word actions use the saved Version's real ID. */
export async function resolveReaderVersion(readerId: string, versionId: string) {
  let version = await getChapterVersion(versionId);
  if (!version) {
    const generation = await resolveGeneration(readerId, versionId);
    if (generation?.status === "pending") return { version: null, pending: true };
    version = generation?.status === "ready" ? generation.artifact?.version ?? null : null;
  }
  if (!version || version.status !== "ready" || (version.readerId !== null && version.readerId !== readerId)) {
    return { version: null, pending: false };
  }
  return { version, pending: false };
}
