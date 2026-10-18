"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChapterCheckAnswers, QuestionGrade } from "../../types";
import { Button } from "../../reading/ui/Button";
import { Dialog } from "../../reading/ui/Dialog";
import { ProgressBar } from "../../reading/ui/ProgressBar";
import { SelectCard } from "../../reading/ui/SelectCard";
import { getAnswerTranscriber } from "../transcription";
import { AnswerInput } from "./AnswerInput";
import { checkFlow, initialCheckFlow, type CheckFlowAction, type CheckFlowState } from "./check-flow";
import type { ChapterCheckPanelProps } from "./types";

// Per Reader: two Readers can share a tab and a Chapter Version (ADR-0008 shares Chapter 1), so drafts must not cross.
const storageKey = (readerId: string, checkId: string) => `tolk-check-flow:${readerId}:${checkId}`;

function FeedbackPanel({ grade }: { grade: QuestionGrade }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const right = grade.grade === 2;
  return (
    <div ref={ref} tabIndex={-1} role="status" className={`mt-6 rounded-card border p-5 outline-light focus-visible:outline-2 motion-safe:animate-page-in ${right ? "border-success bg-success/10" : "border-warning bg-warning/10"}`}>
      <p className={`font-ui text-lg font-bold ${right ? "text-success" : "text-warning"}`}>{right ? "Nice work!" : grade.grade === 1 ? "Almost there" : "Not quite, keep going"}</p>
      <p className="mt-1 font-ui text-base text-ink">{grade.feedback}</p>
      {grade.rereadSentence && <p className="mt-3 font-book text-base text-fog italic">Reread: &ldquo;{grade.rereadSentence}&rdquo;</p>}
    </div>
  );
}

/** One question per screen (#101): answer → Check answer (graded by #97) → feedback → Continue; the last Continue submits the whole Check. */
export function ChapterCheckPanel({ check, readerId, gradeAnswer, onSubmit, transcriber = getAnswerTranscriber() }: ChapterCheckPanelProps) {
  const router = useRouter();
  const [state, setState] = useState<CheckFlowState>(() => initialCheckFlow(check));
  const untouched = useRef(state);
  const key = storageKey(readerId, check.id);
  const [exiting, setExiting] = useState(false);
  const dispatch = (action: CheckFlowAction) => setState((s) => checkFlow(s, action, check));

  // Restores after mount (sessionStorage isn't there during server render), so a refresh reopens the same question.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) setState(initialCheckFlow(check, JSON.parse(saved)));
    } catch {} // blocked storage or a bad entry: start fresh
  }, [check, key]);
  useEffect(() => {
    if (state === untouched.current) return; // the mount pass would overwrite the saved draft before it is restored
    try { sessionStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);

  const question = check.questions[state.index];
  const answer = state.answers[question.id];
  const grade = state.grades[question.id];
  const locked = state.phase !== "answering";
  const last = state.index === check.questions.length - 1;

  async function checkAnswer() {
    if (state.phase !== "answering" || !answer?.value.trim()) return;
    dispatch({ type: "check" });
    try {
      dispatch({ type: "graded", grade: await gradeAnswer(question.id, { questionId: question.id, answer: answer.value, via: answer.via }) });
    } catch {
      dispatch({ type: "failed", message: "Couldn't check your answer. Try again." });
    }
  }

  async function continueOn() {
    if (state.phase !== "feedback") return;
    dispatch({ type: "continue" });
    if (!last) return;
    const submission: ChapterCheckAnswers = {
      answers: check.questions.map((q) => ({ questionId: q.id, answer: state.answers[q.id].value, via: state.answers[q.id].via })),
    };
    try {
      await onSubmit(submission);
      try { sessionStorage.removeItem(key); } catch {}
    } catch {
      dispatch({ type: "failed", message: "Couldn't save your answers. Try again." });
    }
  }

  return (
    <section aria-label="Chapter Check" className="mx-auto flex min-h-[70dvh] max-w-xl flex-col px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => dispatch({ type: "back" })} disabled={state.index === 0 || state.phase === "checking" || state.phase === "submitting"}
          aria-label="Previous question" className="min-h-touch min-w-touch cursor-pointer rounded-control text-xl text-fog outline-light focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-40">
          &larr;
        </button>
        <div className="flex-1">
          <ProgressBar value={state.index + (grade ? 1 : 0)} max={check.questions.length} label={`Question ${state.index + 1} of ${check.questions.length}`} showPercent={false} />
        </div>
        <button type="button" onClick={() => setExiting(true)} aria-label="Leave the Chapter Check"
          className="min-h-touch min-w-touch cursor-pointer rounded-control text-xl text-fog outline-light focus-visible:outline-2">
          &times;
        </button>
      </div>

      <h2 className="mt-8 font-ui text-xl font-bold text-ink">{question.prompt}</h2>

      <div className="mt-5">
        {question.choices ? (
          <fieldset className="grid gap-3" disabled={locked}>
            <legend className="sr-only">{question.prompt}</legend>
            {question.choices.map((choice) => (
              <SelectCard key={choice} type="radio" name={question.id} value={choice} title={choice}
                checked={answer?.value === choice} onChange={() => dispatch({ type: "answer", value: choice, via: "typed" })}
                feedback={grade && answer?.value === choice ? (grade.grade === 2 ? "correct" : "incorrect") : undefined} />
            ))}
          </fieldset>
        ) : locked ? (
          <p className="rounded-control border border-hairline bg-paper p-4 font-ui text-base text-ink">{answer?.value}</p>
        ) : (
          <AnswerInput
            via={answer?.via ?? "typed"}
            onToggleVia={(via) => dispatch({ type: "answer", value: "", via })} // switching mode starts a fresh answer, doesn't relabel the old one
            value={answer?.value ?? ""}
            onChange={(value) => dispatch({ type: "answer", value, via: answer?.via ?? "typed" })}
            transcriber={transcriber}
          />
        )}
      </div>

      {grade && state.phase !== "answering" && <FeedbackPanel key={question.id} grade={grade} />}

      <div className="mt-auto pt-8 pb-4">
        {state.error && <p role="alert" className="mb-3 font-ui text-sm text-error">{state.error}</p>}
        {state.phase === "feedback" || state.phase === "submitting" ? (
          <Button fullWidth onClick={continueOn} loading={state.phase === "submitting"}>{last ? "Finish" : "Continue"}</Button>
        ) : (
          <Button fullWidth onClick={checkAnswer} loading={state.phase === "checking"} disabled={!answer?.value.trim()}>Check answer</Button>
        )}
      </div>

      <Dialog open={exiting} onClose={() => setExiting(false)} title="Leave the Chapter Check?" actions={<>
        <Button onClick={() => setExiting(false)}>Keep going</Button>
        <Button variant="secondary" onClick={() => router.push("/")}>Leave</Button>
      </>}>
        <p className="font-ui text-base text-fog">Come back in this tab and you’ll pick up on the same question.</p>
      </Dialog>
    </section>
  );
}
