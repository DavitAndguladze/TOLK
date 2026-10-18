import { createFlagStore } from "./flag-store";

// In memory until the database lands. On globalThis so every route bundle and hot reload shares one store.
const shared = globalThis as typeof globalThis & { tolkFlagStore?: ReturnType<typeof createFlagStore> };
export const flagStore = (shared.tolkFlagStore ??= createFlagStore());

/** Per-browser Reader id the client sends until sign-in (#7), same header as the Chapter Check. */
export function readerIdOf(req: Request): string {
  return req.headers.get("x-reader-session") ?? "anonymous";
}
