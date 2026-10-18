// A header is an identifier, not a credential: unsigned ids live under `anon:` so they can never name
// a signed-in Reader, and stay short enough for the 191-char reader_id columns.
const SESSION_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** The storage id for a request: the signed-in user's id, else the X-Reader-Session value as `anon:<value>`. */
export function readerIdFrom(userId: string | undefined, sessionHeader: string | null): string {
  if (userId) return userId;
  return sessionHeader && SESSION_ID.test(sessionHeader) ? `anon:${sessionHeader}` : "anonymous";
}
