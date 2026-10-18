"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FAVOURITE_GENRES, READING_GOALS, type FavouriteGenre, type ReaderPreferences, type ReadingGoal } from "../types";
import { Button } from "./ui/Button";
import { ProgressBar } from "./ui/ProgressBar";
import { SelectCard } from "./ui/SelectCard";
import styles from "./OnboardingScreen.module.css";

const GOALS: Record<ReadingGoal, [string, string]> = {
  comprehension: ["Understand what I read", "Follow the meaning and remember what happened."],
  vocabulary: ["Build my vocabulary", "Meet new words in the Books I read."],
  "reading-aloud-confidence": ["Feel confident reading aloud", "Practise at my pace, with support when I need it."],
  "complex-stories": ["Read more complex stories", "Follow richer language and ideas."],
  "advanced-challenge": ["Challenge my reading", "Work towards the author’s original text."],
};
const GENRES: Record<FavouriteGenre, string> = {
  fantasy: "Fantasy", "mystery-thriller": "Mystery and thriller", adventure: "Adventure",
  "science-fiction": "Science fiction", romance: "Romance", "historical-fiction": "Historical fiction",
  horror: "Horror", biography: "Biography", "personal-development": "Personal development", "science-technology": "Science and technology",
};

type Props = { readerId: string; initialPreferences: ReaderPreferences | null };

/** R6 mounts this authenticated screen at /onboarding; changing Reader resets its local draft. */
export function OnboardingScreen(props: Props) {
  return <ReaderOnboarding key={props.readerId} {...props} />;
}

function ReaderOnboarding({ readerId, initialPreferences }: Props) {
  const router = useRouter();
  const [goals, setGoals] = useState<ReadingGoal[]>(initialPreferences?.readingGoals ?? []);
  const [genres, setGenres] = useState<FavouriteGenre[]>(initialPreferences?.favouriteGenres ?? []);
  const [step, setStep] = useState<"goals" | "genres">("goals");
  const [draftReady, setDraftReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signIn, setSignIn] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const request = useRef<AbortController | null>(null);
  const draftKey = `tolk-onboarding:${encodeURIComponent(readerId)}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) ?? "null");
      if (saved && Array.isArray(saved.readingGoals) && Array.isArray(saved.favouriteGenres)) {
        const restoredGoals = READING_GOALS.filter(goal => saved.readingGoals.includes(goal));
        setGoals(restoredGoals);
        setGenres(FAVOURITE_GENRES.filter(genre => saved.favouriteGenres.includes(genre)));
        setStep(saved.step === "genres" && restoredGoals.length > 0 ? "genres" : "goals");
      }
    } catch { /* Storage may be disabled; the screen still works without draft persistence. */ }
    setDraftReady(true);
    return () => { request.current?.abort(); };
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify({ readingGoals: goals, favouriteGenres: genres, step })); }
    catch { /* Saving preferences to the server remains available. */ }
  }, [draftReady, draftKey, goals, genres, step]);

  useEffect(() => { heading.current?.focus(); }, [step]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (request.current || !draftReady || goals.length === 0) return;
    setError(null);
    setSignIn(false);
    if (step === "goals") { setStep("genres"); return; }
    if (genres.length === 0) return;
    const controller = new AbortController();
    request.current = controller;
    setSaving(true);
    try {
      const response = await fetch("/api/reader/preferences", {
        method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingGoals: goals, favouriteGenres: genres } satisfies ReaderPreferences),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setSignIn(response.status === 401);
        setError(response.status === 401 ? "Sign in again to save your choices. Your selections are kept in this tab." : "Your choices couldn’t be saved. Try again; your selections are still here.");
        setSaving(false);
        return;
      }
      try { sessionStorage.removeItem(draftKey); } catch { /* Optional local draft. */ }
      router.replace("/");
      router.refresh();
    } catch {
      if (controller.signal.aborted) return;
      setError("Your choices couldn’t be saved. Try again; your selections are still here.");
      setSaving(false);
    } finally {
      if (!controller.signal.aborted) request.current = null;
    }
  };

  return (
    <main className={styles.screen}>
      <p className={styles.brand}>TOLK</p>
      <ProgressBar value={step === "goals" ? 1 : 2} max={2} label={`Step ${step === "goals" ? 1 : 2} of 2`} showPercent={false} />
      <h1 ref={heading} tabIndex={-1} className={styles.heading}>{step === "goals" ? "What would you like to improve?" : "What do you like to read?"}</h1>
      <p className={styles.intro}>{step === "goals" ? "Choose one or more reading goals. We’ll start with a supported first Chapter." : "Choose one or more favourite genres. These personalise the recommendations in your Library."}</p>
      <form onSubmit={event => void submit(event)}>
        <fieldset disabled={saving || !draftReady} className={styles.choices}>
          <legend className={styles.legend}>{step === "goals" ? "Reading goals" : "Favourite genres"}</legend>
          {step === "goals" ? READING_GOALS.map(goal => <SelectCard key={goal} type="checkbox" name="readingGoals" value={goal} title={GOALS[goal][0]} description={GOALS[goal][1]} checked={goals.includes(goal)} onChange={event => setGoals(current => event.target.checked ? [...current, goal] : current.filter(item => item !== goal))} />)
            : FAVOURITE_GENRES.map(genre => <SelectCard key={genre} type="checkbox" name="favouriteGenres" value={genre} title={GENRES[genre]} checked={genres.includes(genre)} onChange={event => setGenres(current => event.target.checked ? [...current, genre] : current.filter(item => item !== genre))} />)}
        </fieldset>
        {error && <p role="alert" className={styles.error}>{error} {signIn && <Link href="/sign-in">Sign in</Link>}</p>}
        <div className={styles.actions}>
          <Button type="submit" fullWidth loading={saving} disabled={!draftReady || (step === "goals" ? goals.length === 0 : genres.length === 0)}>{step === "goals" ? "Continue" : "Save and open Library"}</Button>
          {step === "genres" && <Button fullWidth variant="secondary" disabled={saving} onClick={() => { setError(null); setStep("goals"); }}>Back to reading goals</Button>}
        </div>
      </form>
    </main>
  );
}
