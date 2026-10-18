// One shared per-Reader budget for paid OCI calls (speech token, grading, meaning, TTS), 0066.
const WINDOW_MS = 60_000;

/** Returns null when the call may go ahead (and spends one), else seconds until the Reader may retry. */
export function createOciQuota(limit: number) {
  const calls = new Map<string, number[]>();
  return (readerId: string, now = Date.now()): number | null => {
    const recent = (calls.get(readerId) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= limit) {
      calls.set(readerId, recent);
      return Math.max(1, Math.ceil((recent[0] + WINDOW_MS - now) / 1000));
    }
    recent.push(now);
    calls.set(readerId, recent);
    return null;
  };
}

// shortcut: in-process memory, so the budget resets on restart and isn't shared across instances; move to MySQL if we scale out.
export const takeOciCall = createOciQuota(30);

/** The 429 a route returns when takeOciCall refuses; says nothing about the Reader's state. */
export function ociQuotaResponse(retryAfter: number) {
  return Response.json({ error: "Too many requests. Wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "private, no-store" } });
}

/** Thrown by a paid call the Reader's budget refused; routes map it to ociQuotaResponse. */
export class OciQuotaError extends Error {
  constructor(readonly retryAfter: number) { super("OCI quota reached"); this.name = "OciQuotaError"; }
}

/** `paid` spends the Reader's budget each time it runs; once refused, `free` answers instead (e.g. the stand-in grader). */
export function metered<A extends unknown[], R>(readerId: string, paid: (...args: A) => Promise<R>, free: (...args: A) => Promise<R>) {
  return (...args: A): Promise<R> => (takeOciCall(readerId) === null ? paid(...args) : free(...args));
}
