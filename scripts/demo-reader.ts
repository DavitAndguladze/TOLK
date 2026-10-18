// The presenter's returning Reader (#16). Creates the account on first use, then resets or seeds only that Reader.
//   DEMO_READER_EMAIL=… DEMO_READER_PASSWORD=… npm run demo:reader -- seed <bookId>
//   DEMO_READER_EMAIL=… npm run demo:reader -- reset
// Needs DATABASE_URL (live HeatWave: open an SSH tunnel through the VM and point DATABASE_URL at it) and,
// to create the account, BETTER_AUTH_SECRET + BETTER_AUTH_URL. Never prints the password or the database URL.
import { eq } from "drizzle-orm";
import { db, getReaderPreferences, setReaderPreferences } from "../src/db";
import { resetDemoReader, seedDemoReader } from "../src/db/demo-reader";
import { user } from "../src/db/schema";
import { auth } from "../src/platform/auth";
import { FAVOURITE_GENRES, READING_GOALS } from "../src/types";

const [command, bookId] = process.argv.slice(2);
const email = process.env.DEMO_READER_EMAIL;

async function readerId(create: boolean): Promise<string> {
  if (!email) throw new Error("Set DEMO_READER_EMAIL.");
  const [found] = await db().select({ id: user.id }).from(user).where(eq(user.email, email));
  if (found) return found.id;
  const password = process.env.DEMO_READER_PASSWORD;
  if (!create || !password) throw new Error(`No Reader with that email${create ? "; set DEMO_READER_PASSWORD to create one" : ""}.`);
  const created = await auth().api.signUpEmail({ body: { email, password, name: "Demo Reader" } });
  return created.user.id;
}

async function main() {
  if (command === "reset" && !bookId) {
    await resetDemoReader(await readerId(false));
    console.log("Demo Reader reset: no progress, history, Word Bank or flags.");
  } else if (command === "seed" && bookId) {
    const id = await readerId(true);
    // The returning Reader has already onboarded, so the Library doesn't redirect the demo to /onboarding.
    if (!(await getReaderPreferences(id))) await setReaderPreferences(id, { readingGoals: [READING_GOALS[0]], favouriteGenres: [FAVOURITE_GENRES[0]] });
    const seeded = await seedDemoReader(id, bookId);
    console.log(`Demo Reader seeded on ${bookId}: ${seeded.history.map((h) => `Chapter ${h.chapter} scored ${h.score}`).join(", ")}.`);
    console.log(`Resumes at ${seeded.resumeVersionId}. A Chapter 3 score of ${seeded.minimumPromotingScore ?? "(none)"} or more promotes to L2.`);
  } else {
    throw new Error("Usage: npm run demo:reader -- seed <bookId> | reset");
  }
}

main().then(() => process.exit(0), (error) => {
  console.error(error instanceof Error ? error.message : "Demo Reader script failed.");
  process.exit(1);
});
