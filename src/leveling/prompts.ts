export type TextGenerator = (prompt: string, options?: { signal?: AbortSignal }) => Promise<string>;

export function parseModelJson(text: string): unknown {
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/, "$1"));
}

/** Racing the signal also bounds injected dependencies that do not implement cancellation. */
export async function withSignal<T>(operation: () => Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  let abort: () => void = () => {};
  const cancelled = new Promise<never>((_, reject) => {
    abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
  });
  try {
    return await Promise.race([Promise.resolve().then(operation), cancelled]);
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

export function deadline(milliseconds: number, signal?: AbortSignal): AbortSignal {
  if (!Number.isInteger(milliseconds) || milliseconds <= 0) throw new Error("Budget must be a positive integer in milliseconds");
  const timeout = AbortSignal.timeout(milliseconds);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
