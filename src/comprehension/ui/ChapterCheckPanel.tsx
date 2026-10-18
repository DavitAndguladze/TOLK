"use client";

import { useState } from "react";
import type { ChapterCheckAnswers } from "../../types";
import { getAnswerTranscriber } from "../transcription";
import { QuestionCard } from "./QuestionCard";
import type { ChapterCheckPanelProps } from "./types";

type DraftAnswer = { value: string; via: "spoken" | "typed" };

export function ChapterCheckPanel({ check, onSubmit, transcriber = getAnswerTranscriber() }: ChapterCheckPanelProps) {
  const [answers, setAnswers] = useState<Record<string, DraftAnswer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = check.questions.every((q) => answers[q.id]?.value.trim());

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const submission: ChapterCheckAnswers = {
        answers: check.questions.map((q) => ({ questionId: q.id, answer: answers[q.id].value, via: answers[q.id].via })),
      };
      await onSubmit(submission);
      setSaved(true);
    } catch {
      setError("Couldn't save your answers - try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return <p className="mx-auto max-w-xl rounded-2xl border border-hairline bg-white/60 p-5 font-ui text-base text-ink">Answers saved.</p>;
  }

  return (
    <section aria-label="Chapter Check" className="px-6">
      <ul className="mx-auto grid max-w-xl gap-4">
        {check.questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            value={answers[q.id]?.value ?? ""}
            via={answers[q.id]?.via ?? "typed"}
            onChange={(value, via) => setAnswers((prev) => ({ ...prev, [q.id]: { value, via } }))}
            transcriber={transcriber}
          />
        ))}
      </ul>

      <div className="mx-auto mt-4 max-w-xl">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="min-h-13 w-full cursor-pointer rounded-2xl bg-light px-4 text-base font-semibold text-white transition outline-light focus-visible:outline-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-hairline disabled:text-fog disabled:active:scale-100"
        >
          {submitting ? "Saving..." : "Submit answers"}
        </button>
        {error && <p className="mt-2 text-sm text-gold">{error}</p>}
      </div>
    </section>
  );
}
