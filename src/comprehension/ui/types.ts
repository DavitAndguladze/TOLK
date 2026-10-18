import type { ChapterCheck, ChapterCheckAnswers, CheckQuestion } from "../../types";
import type { AnswerTranscriber } from "../transcription";

/**
 * Handoff contract for Role 2 (Reading UI): mount this inline on the reading screen via local
 * state (e.g. `phase: "reading" | "check"`), not a route change, so the check opens with no
 * route change or spinner. `onSubmit` today only confirms storage - no result screen until
 * tickets #10/#11/#12 land.
 */
export interface ChapterCheckPanelProps {
  check: ChapterCheck;
  onSubmit: (answers: ChapterCheckAnswers) => Promise<void>;
  transcriber?: AnswerTranscriber;
}

export interface QuestionCardProps {
  question: CheckQuestion;
  value: string;
  via: "spoken" | "typed";
  onChange: (value: string, via: "spoken" | "typed") => void;
  transcriber?: AnswerTranscriber;
}

export interface AnswerInputProps {
  via: "spoken" | "typed";
  onToggleVia: (via: "spoken" | "typed") => void;
  value: string;
  onChange: (value: string) => void;
  transcriber?: AnswerTranscriber;
}
