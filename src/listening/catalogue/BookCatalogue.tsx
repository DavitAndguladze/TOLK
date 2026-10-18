import { Card } from "../../reading/ui/Card";
import controls from "../../reading/ui/DesignSystem.module.css";
import { BookCover } from "./BookCover";
import { CLASSIC_BOOKS } from "./books";
import styles from "./BookCatalogue.module.css";

/** Mount below the real Library Books; none of these entries is a readable app Book. */
export function BookCatalogue() {
  return (
    <section aria-labelledby="classics-heading" className={styles.catalogue}>
      <h2 id="classics-heading" className={styles.heading}>More Chapters to look forward to</h2>
      <p className={styles.intro}>Classics for curious minds. These Books are coming soon to TOLK.</p>
      <ul className={styles.grid}>
        {CLASSIC_BOOKS.map(book => (
          <li key={book.gutenbergId}>
            <Card className={styles.card}>
              <BookCover cover={book.cover} color={book.color} title={book.title} art={"coverArt" in book ? book.coverArt : undefined} />
              <div className={styles.info}>
                <p className={styles.genre}>{book.genre}</p>
                <h3 className={styles.title}>{book.title}</h3>
                <p className={styles.author}>{book.author}</p>
                <p className={styles.soon}>Coming soon</p>
                <details className={styles.details}>
                  <summary>About this Book<span className={styles.srOnly}>: {book.title}</span></summary>
                  <p>{book.description}</p>
                  <p className={styles.estimate}>{book.readingTime} for the original text at 200 words per minute. Your pace will vary.</p>
                  <p className={styles.credit}>Text: public domain in the USA, as listed by Project Gutenberg. {"coverArt" in book ? `Cover: ${book.coverArt.label.toLowerCase()}, ${book.coverArt.year}, public domain in the USA (Wikimedia Commons).` : "Cover: original TOLK vector artwork."}</p>
                  <a href={`https://www.gutenberg.org/ebooks/${book.gutenbergId}`} className={`${controls.button} ${controls.secondary} ${controls.fullWidth} ${styles.source}`}>Original on Gutenberg<span className={styles.srOnly}>: {book.title} (external source)</span></a>
                </details>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
