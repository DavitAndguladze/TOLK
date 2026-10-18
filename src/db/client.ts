import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import * as schema from "./schema";

function connect() {
  const url = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(createPool({ uri: url, connectionLimit: 5 }), { schema, mode: "default" });
}

// One pool per server process, shared across route bundles and hot reloads.
const shared = globalThis as typeof globalThis & { tolkDb?: ReturnType<typeof connect> };
export function db() {
  return (shared.tolkDb ??= connect());
}
