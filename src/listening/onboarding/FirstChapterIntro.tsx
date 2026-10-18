import { Card } from "../../reading/ui/Card";
import controls from "../../reading/ui/DesignSystem.module.css";
import styles from "./FirstChapterIntro.module.css";

/** R6 resolves the actual first Version/Check and account eligibility before mounting this view. */
export function FirstChapterIntro({ bookTitle, chapterTitle, questionCount, startHref }: {
  bookTitle: string;
  chapterTitle: string;
  questionCount: number;
  startHref: string;
}) {
  return (
    <main aria-labelledby="first-chapter-heading" className={styles.screen}>
      <p className={styles.brand}>TOLK</p>
      <svg aria-hidden="true" viewBox="0 0 180 132" className={styles.art} fill="none">
        <circle cx="90" cy="68" r="58" fill="var(--color-glow)" opacity=".55" />
        <path d="M90 53C69 40 50 40 29 45v61c22-5 41-1 61 11 20-12 39-16 61-11V45c-21-5-40-5-61 8Z" fill="white" stroke="var(--color-light)" strokeWidth="3" />
        <path d="M90 62C67 51 48 51 26 57l6 53c21-3 40 2 58 12 18-10 37-15 58-12l6-53c-22-6-41-6-64 5Z" fill="var(--color-light)" />
        <path d="M90 63v59M48 76l24 5m-23 9 23 5m60-19-24 5m23 9-23 5" stroke="white" strokeWidth="3" strokeLinecap="round" opacity=".7" />
        <path d="M90 29V16m-23 17-7-10m53 10 7-10" stroke="var(--color-gold)" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <h1 id="first-chapter-heading" className={styles.heading}>Your first Chapter</h1>
      <p className={styles.intro}>A new story, at your pace.</p>
      <Card className={styles.book}>
        <h2 className={styles.bookTitle}>{bookTitle}</h2>
        <p className={styles.chapter}>{chapterTitle}</p>
      </Card>
      <ol className={styles.steps}>
        <li><strong>Read in small parts.</strong><p>Take as long as you need. You can pause and come back.</p></li>
        <li><strong>Answer {questionCount} {questionCount === 1 ? "question" : "questions"}.</strong><p>Your Chapter Check helps us understand what support may help you next.</p></li>
        <li><strong>Read aloud if you like.</strong><p>It’s optional. Reading aloud helps us grade your reading more accurately. Silent reading works too.</p></li>
      </ol>
      <p className={styles.reassurance}>There’s no placement test. This is practice, and feedback helps you keep learning.</p>
      {/* A plain link: startHref is the open route, which records progress, so it must never be prefetched. */}
      <a href={startHref} className={`${controls.button} ${controls.primary} ${controls.fullWidth} ${styles.start}`}>Start reading</a>
    </main>
  );
}
