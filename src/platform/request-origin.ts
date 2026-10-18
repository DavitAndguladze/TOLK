export function wrongOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (origin === null) return false;
  try {
    // Caddy forwards to an internal Next URL; use the same public origin as authentication.
    return origin !== new URL(process.env.BETTER_AUTH_URL || req.url).origin;
  } catch { return true; }
}
