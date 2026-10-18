// The Library (#7, #103): every Book as a cover grid, searchable by title or author and filterable by genre,
// with the Reader's place in each and "Recommended for you" from their saved Favourite Genres.
import Link from "next/link";
import { getReaderPreferences, listLibrary } from "@/db";
import { BookCatalogue } from "@/listening/catalogue/BookCatalogue";
import { requireReader } from "@/platform/auth";
import { Button } from "@/reading/ui/Button";
import { Card } from "@/reading/ui/Card";
import type { Book, BookProgress, FavouriteGenre } from "@/types";
import { GENRE_LABELS, genresOf, inGenres, parseGenre } from "./book-genres";
import { PaperBackground } from "./PaperBackground";
import { Shelf } from "./Shelf";
import { SignOutButton } from "./SignOutButton";

type LibraryBook = Book & { progress: BookProgress | null };

/** The Library URL for a search and genre; empty values are left out so "/" stays the plain Library. */
function libraryHref(q: string, genre: FavouriteGenre | null) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (genre) params.set("genre", genre);
  const search = params.toString();
  return search ? `/?${search}` : "/";
}

// Cover images for seeded Books whose (immutable) row has no coverImageUrl, e.g. "gatsby-full": "/covers/gatsby.jpg".
// Books without one get the typographic cover.
const COVER_IMAGES: Record<string, string> = {};
const coverOf = (book: Book): string | undefined => book.coverImageUrl ?? COVER_IMAGES[book.id];

const sectionHeading ="font-book text-[1.5rem] leading-tight font-medium";

export default async function Library({ searchParams }: { searchParams: Promise<{ q?: string | string[]; genre?: string | string[] }> }) {
  // searchParams first: it marks the page dynamic, so `next build` never prerenders it (no database at build).
  const { q, genre: genreParam } = await searchParams;
  const reader = await requireReader("/welcome"); // a signed-out first open starts at Welcome (#98)
  const query = typeof q === "string" ? q : "";
  const genre = parseGenre(genreParam);
  const [found, preferences] = await Promise.all([listLibrary(reader.id, query), getReaderPreferences(reader.id)]);
  const books = genre ? inGenres(found, [genre]) : found;
  // Only genres the found Books really have, so no filter leads to an empty shelf; the active one stays visible.
  const genres = (Object.keys(GENRE_LABELS) as FavouriteGenre[]).filter((g) => g === genre || found.some((b) => genresOf(b.id).includes(g)));
  const recommended = !query && !genre && preferences ? inGenres(found, preferences.favouriteGenres) : [];

  return (
    <main className="relative isolate min-h-full px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-12">
      <PaperBackground />
      <div className="mx-auto max-w-xl">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-book text-[1.0625rem] text-fog italic">{reader.name}</p>
          <SignOutButton />
        </header>
        <Shelf />
        <h1 className="mt-3 text-center font-book text-[2.25rem] leading-tight font-medium">Library</h1>

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
          {genre && <input type="hidden" name="genre" value={genre} />}
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {genres.length > 0 && (
          <nav aria-label="Genres" className="mt-4">
            <ul className="flex flex-wrap gap-2">
              {[null, ...genres].map((g) => (
                <li key={g ?? "all"}>
                  <Link
                    href={libraryHref(query, g)}
                    aria-current={g === genre ? "page" : undefined}
                    className="inline-flex min-h-11 items-center rounded-full border border-hairline bg-white/70 px-4 text-sm font-semibold text-ink outline-light outline-offset-2 hover:bg-glow/40 focus-visible:outline-3 aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-paper"
                  >
                    {g ? GENRE_LABELS[g] : "All"}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {recommended.length > 0 && (
          <section aria-labelledby="recommended-heading" className="mt-8">
            <h2 id="recommended-heading" className={sectionHeading}>
              Recommended for you
            </h2>
            <p className="mt-1 text-sm text-fog">From the genres you picked.</p>
            <BookGrid books={recommended} />
          </section>
        )}

        <section aria-labelledby="books-heading" className="mt-8">
          <h2 id="books-heading" className={recommended.length ? sectionHeading : "sr-only"}>
            {genre ? GENRE_LABELS[genre] : "All Books"}
          </h2>
          {books.length === 0 ? (
            <p className="mt-4 text-fog">
              {query
                ? `No Books match “${query}”${genre ? ` in ${GENRE_LABELS[genre]}` : ""}.`
                : genre
                  ? `No ${GENRE_LABELS[genre]} Books yet.`
                  : "No Books yet."}
            </p>
          ) : (
            <BookGrid books={books} />
          )}
        </section>

        {/* Coming-soon classics (#96): not app Books, so they sit outside search results. */}
        {!query && (
          <div className="mt-10">
            <BookCatalogue />
          </div>
        )}
      </div>
    </main>
  );
}

function BookGrid({ books }: { books: LibraryBook[] }) {
  return (
    <div className="@container mt-4">
      <ul className="grid grid-cols-2 items-start gap-3 @max-[17.5rem]:grid-cols-1 @min-[40rem]:grid-cols-3">
        {books.map((book) => (
          <li key={book.id}>
            <Card className="overflow-hidden rounded-[1.1rem] p-0">
              {/* A plain <a>, not <Link>: this leads into the open flow, which records progress, so it must never be prefetched. */}
              <a
                href={`/books/${book.id}/start`}
                className="flex flex-col rounded-[inherit] outline-light outline-offset-2 hover:bg-glow/20 focus-visible:outline-3 motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:translate-y-0.5"
              >
                {coverOf(book) ? (
                  <img src={coverOf(book)} alt="" className="block aspect-[8/9] w-full object-cover @max-[17.5rem]:max-h-52" />
                ) : (
                  <TypographicCover title={book.title} author={book.author} />
                )}
                <span className="flex flex-col p-3">
                  <span className="font-book text-[1.0625rem] leading-snug font-medium [overflow-wrap:anywhere]">{book.title}</span>
                  <span className="mt-1 text-[0.8rem] text-fog">{book.author}</span>
                  <span className="mt-2 text-sm font-semibold text-light">
                    {book.progress ? `Chapter ${book.progress.currentChapterNumber} · Level ${book.progress.currentLevel}` : "Start at Chapter 1"}
                  </span>
                </span>
              </a>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A cover set in type, framed like the catalogue's covers (#96): real Books carry no cover art yet. */
function TypographicCover({ title, author }: { title: string; author: string }) {
  return (
    <span aria-hidden="true" className="relative flex aspect-[8/9] flex-col items-center justify-center bg-ink px-5 text-center text-[#f4e6bf] @max-[17.5rem]:max-h-52">
      <span className="absolute inset-[5.6%] border-[1.5px] border-current opacity-35" />
      <span className="font-book text-[1.15rem] leading-tight font-medium [overflow-wrap:anywhere]">{title}</span>
      <span className="mt-3 h-px w-8 bg-current opacity-60" />
      <span className="mt-3 text-[0.65rem] font-semibold tracking-[0.14em] uppercase">{author}</span>
    </span>
  );
}
