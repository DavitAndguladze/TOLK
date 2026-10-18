export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { migrateAndSeed } = await import("./db/migrate");
  await migrateAndSeed();
}
