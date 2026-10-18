// Better Auth on MySQL (#7). A Reader is a Better Auth user; sign in is email + password.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../db/client";
import * as schema from "../db/schema";
import type { Reader } from "../types";
import { readerIdFrom } from "./reader-id";

function create() {
  return betterAuth({
    database: drizzleAdapter(db(), { provider: "mysql", schema }),
    emailAndPassword: { enabled: true, autoSignIn: true },
    plugins: [nextCookies()],
  });
}

// Built on first use, not at import, so `next build` needs no database.
const shared = globalThis as typeof globalThis & { tolkAuth?: ReturnType<typeof create> };
export function auth() {
  return (shared.tolkAuth ??= create());
}

/** The signed-in Reader, or null. Server Components, Server Functions and route handlers. */
export async function getReader(): Promise<Reader | null> {
  // headers() first: it marks the page per-request, so `next build` never reaches the database.
  const h = await headers();
  const session = await auth().api.getSession({ headers: h });
  return session ? { id: session.user.id, name: session.user.name, email: session.user.email } : null;
}

/** The signed-in Reader; otherwise redirects to sign in. */
export async function requireReader(): Promise<Reader> {
  return (await getReader()) ?? redirect("/sign-in");
}

/**
 * Who a route handler is acting for: the signed-in Reader, else the per-browser X-Reader-Session id
 * (namespaced, see readerIdFrom) while the reading page, flags and answers move onto sign-in (#7).
 */
export async function readerIdFor(req: Request): Promise<string> {
  const session = await auth().api.getSession({ headers: req.headers });
  return readerIdFrom(session?.user.id, req.headers.get("x-reader-session"));
}
