// Integration: needs MySQL (`npm run db:up`, then DATABASE_URL=mysql://tolk:tolk@localhost:3306/tolk). Skipped otherwise.
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const enabled = Boolean(process.env.DATABASE_URL);

describe.skipIf(!enabled)("Reader preferences (#99)", () => {
  let store: typeof import(".");
  beforeAll(async () => {
    store = await import(".");
    const { migrate } = await import("drizzle-orm/mysql2/migrator");
    await migrate(store.db(), { migrationsFolder: "drizzle" });
  });

  const reader = async () => {
    const id = `reader-${randomUUID()}`;
    await store.db().insert((await import("./schema")).user).values({ id, name: "Test", email: `${id}@example.com` });
    return id;
  };

  it("is null before onboarding", async () => {
    expect(await store.getReaderPreferences(await reader())).toBeNull();
  });

  it("saves, then replaces, one Reader's picks without touching another's", async () => {
    const [a, b] = [await reader(), await reader()];
    await store.setReaderPreferences(a, { readingGoals: ["vocabulary"], favouriteGenres: ["horror"] });
    await store.setReaderPreferences(b, { readingGoals: ["comprehension"], favouriteGenres: ["romance"] });
    await store.setReaderPreferences(a, { readingGoals: ["complex-stories", "vocabulary"], favouriteGenres: ["adventure"] });

    expect(await store.getReaderPreferences(a)).toEqual({ readingGoals: ["complex-stories", "vocabulary"], favouriteGenres: ["adventure"] });
    expect(await store.getReaderPreferences(b)).toEqual({ readingGoals: ["comprehension"], favouriteGenres: ["romance"] });
  });
});
