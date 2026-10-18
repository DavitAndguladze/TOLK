import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { checkAnswerGrades as t } from "../db/schema";
import type { AnswerGradeKey, AnswerGradeStore } from "./answer-grades";

const answerHash = (answer: string) => createHash("sha256").update(answer).digest("hex");
const row = (key: AnswerGradeKey) =>
  and(eq(t.readerId, key.readerId), eq(t.checkId, key.checkId), eq(t.questionId, key.questionId), eq(t.answerHash, answerHash(key.answer)));

/** Key Point grades from Check (#97), kept so submitting the Chapter Check reuses them. */
export function createMySqlAnswerGradeStore(): AnswerGradeStore {
  return {
    async get(key) {
      const [found] = await db().select({ data: t.data }).from(t).where(row(key));
      return found?.data ?? null;
    },
    async save(key, grade) {
      // shortcut: two simultaneous Checks of the same answer can both reach OCI; the first saved grade wins and is what submitting reuses.
      await db().insert(t).values({ readerId: key.readerId, checkId: key.checkId, questionId: key.questionId, answerHash: answerHash(key.answer), data: grade })
        .onDuplicateKeyUpdate({ set: { readerId: key.readerId } });
    },
  };
}
