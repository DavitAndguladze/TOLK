import { getSavedGenerationInput, promotePendingProgress } from "../comprehension/complete-chapter";
import { getReader } from "../platform/auth";
import { wrongOrigin } from "../platform/request-origin";
import { runGeneration } from "./runtime";

const json = (body: unknown, status = 200, headers = {}) => Response.json(body, {
  status, headers: { "Cache-Control": "private, no-store", ...headers },
});

/** A retry can spend only this Reader's saved generation budget, using the immutable completion input. */
export async function retryVersion(req: Request, context: { params: Promise<{ versionId: string }> }) {
  try {
    const reader = await getReader();
    if (!reader) return json({ error: "Sign in to prepare your next Chapter." }, 401);
    if (wrongOrigin(req) || req.headers.get("sec-fetch-site") === "cross-site") {
      return json({ error: "Invalid request origin" }, 403);
    }
    const { versionId } = await context.params;
    const input = await getSavedGenerationInput(reader.id, versionId);
    if (!input) return json({ error: "Chapter generation not found" }, 404);
    const generation = await runGeneration(versionId, input);
    if (generation?.status === "ready" && generation.artifact) {
      await promotePendingProgress(reader.id, versionId);
      return json(generation.artifact.version);
    }
    if (generation?.status === "pending") {
      return json({ status: "generating" }, 202, { "Retry-After": "2" });
    }
    if (generation && generation.claimCount >= 3) {
      return json({ error: "No preparation retries remain for this Chapter. Your result is saved." }, 409);
    }
    return json({ error: "Couldn't prepare your next Chapter. Your result is saved. Try again." }, 503, { "Retry-After": "2" });
  } catch (err) {
    console.warn("Chapter retry could not continue:", err instanceof Error ? err.name : "unknown");
    return json({ error: "Couldn't prepare your next Chapter. Your result is saved. Try again." }, 503, { "Retry-After": "2" });
  }
}
