import type { ChapterCheck, ChapterCheckAnswers, QuestionGrade } from "../../types";
import type { AnswerTranscriber } from "../transcription";

/**
 * Handoff contract for Role 2 (Reading UI): mounted inline on the reading screen, not a route change.
 * `gradeAnswer` grades one answer on Check (#97); `onSubmit` sends the whole Check after the last one.
 */
export interface ChapterCheckPanelProps {
  check: ChapterCheck;
  /** The signed-in Reader, so a saved draft belongs to them alone. */
  readerId: string;
  gradeAnswer: (questionId: string, entry: ChapterCheckAnswers["answers"][number]) => Promise<QuestionGrade>;
  onSubmit: (answers: ChapterCheckAnswers) => Promise<void>;
  transcriber?: AnswerTranscriber;
}

export interface AnswerInputProps {
  via: "spoken" | "typed";
  onToggleVia: (via: "spoken" | "typed") => void;
  value: string;
  onChange: (value: string) => void;
  transcriber?: AnswerTranscriber;
}
