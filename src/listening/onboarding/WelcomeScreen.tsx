"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../reading/ui/Button";
import controls from "../../reading/ui/DesignSystem.module.css";
import styles from "./WelcomeScreen.module.css";

const SEEN_KEY = "tolk-welcome-seen-v1";
const SPLASH_MS = 1200;

/** Original vector artwork; no external illustration or character assets. */
function ReadingBook() {
  return (
    <svg aria-hidden="true" viewBox="0 0 240 200" className={styles.book} fill="none">
      <circle cx="120" cy="104" r="82" fill="var(--color-glow)" opacity="0.45" />
      <ellipse cx="120" cy="174" rx="78" ry="8" fill="var(--color-light)" opacity="0.12" />
      <path d="M120 55V35M86 63 75 47M154 63l11-16" stroke="#d69717" strokeWidth="5" strokeLinecap="round" />
      <path d="M120 94C95 75 68 76 45 82v76c27-6 51-3 75 12 24-15 48-18 75-12V82c-23-6-50-7-75 12Z" fill="white" stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M120 101C94 90 72 88 43 92l7 70c28-3 49 1 70 12 21-11 42-15 70-12l7-70c-29-4-51-2-77 9Z" fill="var(--color-light)" />
      <path d="M120 102v72" stroke="var(--color-ink)" strokeWidth="3" opacity="0.45" />
      <path d="m63 112 36 7m-34 9 33 7m79-23-36 7m34 9-33 7" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}

/** Mount only for signed-out Readers. R6 owns the auth gate and both real destinations. */
export function WelcomeScreen({ signUpHref, signInHref }: { signUpHref: string; signInHref: string }) {
  const [phase, setPhase] = useState<"checking" | "splash" | "welcome">("checking");
  const ready = phase === "welcome";
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const finish = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* Storage never blocks entry. */ }
    setPhase("welcome");
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN_KEY) === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finish();
        return;
      }
    } catch {
      finish();
      return;
    }
    setPhase("splash");
    timer.current = setTimeout(finish, SPLASH_MS);
    return () => { if (timer.current !== null) clearTimeout(timer.current); };
  }, [finish]);

  useEffect(() => { if (ready) heading.current?.focus(); }, [ready]);

  if (phase === "checking") return <main className={styles.screen} aria-busy="true"><p className={styles.wordmark}>TOLK</p><p role="status">Getting ready to read…</p></main>;

  return (
    <main className={styles.screen} aria-labelledby={ready ? "welcome-heading" : "splash-heading"}>
      <p className={styles.wordmark}>TOLK</p>
      <div className={ready ? styles.illustration : `${styles.illustration} ${styles.arrival}`}><ReadingBook /></div>
      {ready ? (
        <>
          <h1 ref={heading} id="welcome-heading" tabIndex={-1} className={styles.heading}>Read more.<br />Understand more.<br />Grow every day.</h1>
          <p className={styles.description}>Find a Book. Read at your pace. Move closer to the author’s original, one Chapter at a time.</p>
          <nav aria-label="Get started with TOLK" className={styles.actions}>
            <Link href={signUpHref} className={`${controls.button} ${controls.primary} ${controls.fullWidth}`}>Get started</Link>
            <Link href={signInHref} className={`${controls.button} ${controls.secondary} ${controls.fullWidth}`}>I already have an account</Link>
          </nav>
        </>
      ) : (
        <>
          <h1 id="splash-heading" className={styles.heading}>A little reading.<br />A new beginning.</h1>
          <p className={styles.description}>Read more. Understand more. Grow every day.</p>
          <div className={styles.actions}><Button variant="secondary" fullWidth onClick={finish}>Skip introduction</Button></div>
        </>
      )}
    </main>
  );
}
