export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { migrateAndSeed } = await import("./db/migrate");
    await migrateAndSeed();
  }
}
