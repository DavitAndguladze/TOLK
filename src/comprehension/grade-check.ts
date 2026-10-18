import type {
  AnswerGrade, Chapter, ChapterCheck, ChapterCheckAnswers, ChapterVersion, CheckQuestion, KeyPoint, KeyPointGradedBy,
  QuestionGrade, ReadAloudSummary, Sentence, SessionResult,
} from "../types";
import { combineGrading } from "./grading";

/** The AI half of grading: one open Key Point answer → 0–2 and a one-line feedback. OCI Generative AI implements it. */
export type KeyPointGrader = (input: {
  question: CheckQuestion;
  keyPoint: KeyPoint;
  answer: string;
  /** The sentence in this Chapter Version that answers the question. */
  sentence: Sentence;
}) => Promise<{ grade: AnswerGrade; feedback: string; gradedBy: KeyPointGradedBy }>;

export interface GradeChapterCheckInput {
  check: ChapterCheck;
  chapter: Chapter;
  version: ChapterVersion;
  /** Already validated by recordAnswers: one answer per question. */
  answers: ChapterCheckAnswers;
  readAloud: ReadAloudSummary | null;
  flaggedWords: string[];
  readerId: string;
}

/**
 * Grades one Chapter Check answer: Complex Word choices exactly (no AI), Key Point answers with the
 * Key Point grader. gradedBy is null for a Complex Word question. Used when the Reader presses Check (#97)
 * and for the whole Check, so both give the same grade.
 */
export async function gradeQuestion(
  input: { question: CheckQuestion; chapter: Chapter; version: ChapterVersion; answer: string },
  deps: { keyPointGrader: KeyPointGrader },
): Promise<{ grade: QuestionGrade; gradedBy: KeyPointGradedBy | null }> {
  const { question, chapter, version, answer } = input;
  if (question.kind === "complex-word") {
    // Multiple choice built from the Chapter's Complex Words, so the right answer is known: no AI needed.
    const complexWord = chapter.complexWords.find((w) => w.word === question.word);
    if (!complexWord) {
      // A Check named a word this Chapter no longer has (stale seed/content edit): hold the question
      // rather than fail the whole completion, so the mismatch doesn't block the Reader's grade.
      console.warn(`Chapter Check question ${question.id} asks about "${question.word}", which isn't one of Chapter ${chapter.id}'s Complex Words; holding it.`);
      return { grade: { questionId: question.id, grade: 2, feedback: "Held: not scored.", rereadSentenceIndex: null, rereadSentence: null }, gradedBy: null };
    }
    if (answer === complexWord.meaning) {
      return { grade: { questionId: question.id, grade: 2, feedback: "Yes.", rereadSentenceIndex: null, rereadSentence: null }, gradedBy: null };
    }
    const missedSentence = version.sentences.find((s) => s.index === question.answerSentenceIndex)!;
    const feedback = `'${question.word}' means ${complexWord.meaning}.`;
    return { grade: { questionId: question.id, grade: 0, feedback, rereadSentenceIndex: question.answerSentenceIndex, rereadSentence: missedSentence.text }, gradedBy: null };
  }
  const keyPoint = chapter.keyPoints.find((kp) => kp.id === question.keyPointId)!;
  const sentence = version.sentences.find((s) => s.index === question.answerSentenceIndex)!;
  const { grade, feedback, gradedBy } = await deps.keyPointGrader({ question, keyPoint, answer, sentence });
  return {
    grade: { questionId: question.id, grade, feedback, rereadSentenceIndex: grade < 2 ? sentence.index : null, rereadSentence: grade < 2 ? sentence.text : null },
    gradedBy,
  };
}

/** Grades each answer, then combines them with read-aloud and Flagged Words into the Chapter's Session Result. */
export async function gradeChapterCheck(
  input: GradeChapterCheckInput,
  deps: { keyPointGrader: KeyPointGrader; now: () => Date },
): Promise<SessionResult> {
  const { check, chapter, version, answers } = input;
  const answerTo = new Map(answers.answers.map((a) => [a.questionId, a.answer]));

  const graded = await Promise.all(
    check.questions.map((question) => gradeQuestion({ question, chapter, version, answer: answerTo.get(question.id) ?? "" }, deps)),
  );
  const questionGrades: QuestionGrade[] = graded.map((g) => g.grade);
  const keyPointGradedBy = graded.flatMap((g) => (g.gradedBy ? [g.gradedBy] : []));

  const complexWordMisses = check.questions
    .filter((q, i) => q.kind === "complex-word" && questionGrades[i].grade === 0)
    .map((q) => q.word!);

  const completedAt = deps.now().toISOString();
  return {
    id: `${check.id}:${input.readerId}:${completedAt}`,
    readerId: input.readerId,
    chapterVersionId: version.id,
    chapterNumber: version.chapterNumber,
    level: version.level,
    readAloudMisses: input.readAloud?.misses ?? [],
    grading: combineGrading({
      questionGrades,
      readAloud: input.readAloud,
      flaggedWords: input.flaggedWords,
      complexWordMisses,
      // Credit OCI only when it graded every Key Point answer.
      gradedBy: keyPointGradedBy.length > 0 && keyPointGradedBy.every((g) => g === "oci-generative-ai") ? "oci-generative-ai" : "stand-in",
    }),
    completedAt,
  };
}
