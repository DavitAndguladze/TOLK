export async function register() {
  // Import inside a positive check, not after an early return: webpack only drops the Node-only DB code
  // (mysql2 → string_decoder) from the edge build in this form.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { migrateAndSeed } = await import("./db/migrate");
    await migrateAndSeed();
  }
}
