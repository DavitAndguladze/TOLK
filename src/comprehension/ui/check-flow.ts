import type { ChapterCheck, QuestionGrade } from "../../types";

export type Via = "spoken" | "typed";
export type DraftAnswer = { value: string; via: Via };

/**
 * The Chapter Check as one question per screen (#101): answer → Check (graded by #97) → feedback →
 * Continue, and after the last question the whole Check is submitted. Pure, so the rules are tested
 * apart from the UI. A checked answer is locked: back shows it with its feedback.
 */
export interface CheckFlowState {
  index: number;
  answers: Record<string, DraftAnswer>;
  grades: Record<string, QuestionGrade>;
  phase: "answering" | "checking" | "feedback" | "submitting";
  error: string | null;
}

export type CheckFlowAction =
  | { type: "answer"; value: string; via: Via }
  | { type: "check" }
  | { type: "graded"; grade: QuestionGrade }
  | { type: "failed"; message: string }
  | { type: "continue" }
  | { type: "back" };

/** The phase a question opens in: its feedback once it has been checked, otherwise answering. */
const settle = (state: Omit<CheckFlowState, "phase">, check: ChapterCheck): CheckFlowState => ({
  ...state,
  phase: state.grades[check.questions[state.index]?.id] ? "feedback" : "answering",
});

/** A fresh flow, or one restored after a refresh: only this Check's questions are kept, and a Check that was in flight is answered again (#97 reuses its stored grade). */
export function initialCheckFlow(check: ChapterCheck, saved?: CheckFlowState | null): CheckFlowState {
  const ids = new Set(check.questions.map((q) => q.id));
  const keep = <T,>(record: Record<string, T> | undefined) => Object.fromEntries(Object.entries(record ?? {}).filter(([id]) => ids.has(id)));
  const index = saved && Number.isInteger(saved.index) && saved.index >= 0 && saved.index < check.questions.length ? saved.index : 0;
  return settle({ index, answers: keep(saved?.answers), grades: keep(saved?.grades), error: null }, check);
}

export function checkFlow(state: CheckFlowState, action: CheckFlowAction, check: ChapterCheck): CheckFlowState {
  const question = check.questions[state.index];
  switch (action.type) {
    case "answer":
      if (state.phase !== "answering") return state;
      return { ...state, answers: { ...state.answers, [question.id]: { value: action.value, via: action.via } }, error: null };
    case "check":
      if (state.phase !== "answering" || !state.answers[question.id]?.value.trim()) return state;
      return { ...state, phase: "checking", error: null };
    case "graded":
      if (state.phase !== "checking" || action.grade.questionId !== question.id) return state;
      return { ...state, phase: "feedback", grades: { ...state.grades, [question.id]: action.grade } };
    case "failed":
      if (state.phase === "checking") return { ...state, phase: "answering", error: action.message };
      if (state.phase === "submitting") return { ...state, phase: "feedback", error: action.message };
      return state;
    case "continue":
      if (state.phase !== "feedback") return state;
      if (state.index === check.questions.length - 1) return { ...state, phase: "submitting", error: null };
      return settle({ ...state, index: state.index + 1, error: null }, check);
    case "back":
      if (state.index === 0 || state.phase === "checking" || state.phase === "submitting") return state;
      return settle({ ...state, index: state.index - 1, error: null }, check);
  }
}
