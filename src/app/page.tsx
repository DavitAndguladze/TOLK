// The Library (#7): every Book, searchable by title or author, with the Reader's place in each.
import { listLibrary } from "@/db";
import { requireReader } from "@/platform/auth";
import { SignOutButton } from "./SignOutButton";

export default async function Library({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  // searchParams first: it marks the page dynamic, so `next build` never prerenders it (no database at build).
  const { q } = await searchParams;
  const reader = await requireReader();
  const query = typeof q === "string" ? q : "";
  const books = await listLibrary(reader.id, query);

  return (
    <main className="min-h-dvh px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-12">
      <div className="mx-auto max-w-xl">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-book text-[1.0625rem] text-fog italic">{reader.name}</p>
          <SignOutButton />
        </header>
        <h1 className="font-book text-[1.75rem] leading-tight font-medium">Library</h1>

        <form role="search" action="/" method="get" className="mt-4 flex gap-2">
          <label htmlFor="q" className="sr-only">
            Search by title or author
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Title or author"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-hairline bg-white/70 px-3 text-base outline-light focus-visible:outline-2"
          />
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-mist outline-light outline-offset-2 focus-visible:outline-2"
          >
            Search
          </button>
        </form>

        {books.length === 0 ? (
          <p className="mt-8 text-fog">{query ? `No Books match “${query}”.` : "No Books yet."}</p>
        ) : (
          <ul className="mt-6 border-t border-hairline">
            {books.map((book) => (
              <li key={book.id} className="border-b border-hairline">
                {/* A plain <a>, not <Link>: opening a Book records progress, so it must never be prefetched. */}
                <a
                  href={`/books/${book.id}/open`}
                  className="flex min-h-11 flex-col py-4 outline-light hover:bg-white/40 focus-visible:outline-2"
                >
                  <span className="font-book text-[1.25rem] leading-snug font-medium">{book.title}</span>
                  <span className="text-sm text-fog">{book.author}</span>
                  <span className="mt-1 text-sm font-semibold text-light">
                    {book.progress
                      ? `Chapter ${book.progress.currentChapterNumber} · Level ${book.progress.currentLevel}`
                      : "Start at Chapter 1"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
