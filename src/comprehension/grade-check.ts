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

/** Grades each answer, then combines them with read-aloud and Flagged Words into the Chapter's Session Result. */
export async function gradeChapterCheck(
  input: GradeChapterCheckInput,
  deps: { keyPointGrader: KeyPointGrader; now: () => Date },
): Promise<SessionResult> {
  const { check, chapter, version, answers } = input;
  const answerTo = new Map(answers.answers.map((a) => [a.questionId, a.answer]));
  const keyPointGradedBy: KeyPointGradedBy[] = [];

  const questionGrades: QuestionGrade[] = await Promise.all(
    check.questions.map(async (question) => {
      const answer = answerTo.get(question.id) ?? "";
      if (question.kind === "complex-word") {
        // Multiple choice built from the Chapter's Complex Words, so the right answer is known: no AI needed.
        const { meaning } = chapter.complexWords.find((w) => w.word === question.word)!;
        return answer === meaning
          ? { questionId: question.id, grade: 2 as const, feedback: "Yes.", rereadSentenceIndex: null }
          : {
              questionId: question.id,
              grade: 0 as const,
              feedback: `'${question.word}' means ${meaning}.`,
              rereadSentenceIndex: question.answerSentenceIndex,
            };
      }
      const keyPoint = chapter.keyPoints.find((kp) => kp.id === question.keyPointId)!;
      const sentence = version.sentences.find((s) => s.index === question.answerSentenceIndex)!;
      const { grade, feedback, gradedBy } = await deps.keyPointGrader({ question, keyPoint, answer, sentence });
      keyPointGradedBy.push(gradedBy);
      return { questionId: question.id, grade, feedback, rereadSentenceIndex: grade < 2 ? sentence.index : null };
    }),
  );

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
