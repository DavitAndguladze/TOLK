// Library genres (#103): which Favourite Genres each real Book belongs to, for the filters and "Recommended for you".
import { FAVOURITE_GENRES, type FavouriteGenre } from "../types";

export const GENRE_LABELS: Record<FavouriteGenre, string> = {
  fantasy: "Fantasy",
  "mystery-thriller": "Mystery & thriller",
  adventure: "Adventure",
  "science-fiction": "Science fiction",
  romance: "Romance",
  "historical-fiction": "Historical fiction",
  horror: "Horror",
  biography: "Biography",
  "personal-development": "Personal development",
  "science-technology": "Science & technology",
};

// shortcut: kept here, not in the Book JSON, because seeded Book rows are immutable (loadGatsbySource asserts
// they match content.json); move into Book content when a second real Book is imported.
const BOOK_GENRES: Record<string, FavouriteGenre[]> = {
  "gatsby-full": ["romance", "historical-fiction"],
  gatsby: ["romance", "historical-fiction"], // the mock Gatsby seeded until #43's bundle replaces it
};

export const genresOf = (bookId: string): FavouriteGenre[] => BOOK_GENRES[bookId] ?? [];

/** A `?genre=` value as a known genre, else null (show every Book). */
export const parseGenre = (value: unknown): FavouriteGenre | null =>
  FAVOURITE_GENRES.includes(value as FavouriteGenre) ? (value as FavouriteGenre) : null;

/** Books in any of the given genres, in their given order. */
export const inGenres = <B extends { id: string }>(books: B[], genres: readonly FavouriteGenre[]): B[] =>
  books.filter((book) => genresOf(book.id).some((g) => genres.includes(g)));
