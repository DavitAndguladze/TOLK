import type { ChapterOutcome, Level, LevelDecision } from "../types";

/** Pure Level decision; history is scoped and reset by the storage adapter (ChapterOutcome). */
export const decideNextLevel: ChapterOutcome["decideNextLevel"] = (current, grading, history = []) => {
  const distinct = new Map<number, (typeof history)[number]>();
  for (const session of history) {
    if (session.level !== current) {
      distinct.clear();
      continue;
    }
    if (!distinct.has(session.chapterNumber)) distinct.set(session.chapterNumber, session);
  }
  const recent = [...distinct.values()].slice(-3);
  const decision: LevelDecision = {
    from: current,
    to: current,
    reason: "insufficient-history",
    explanation: "Your next Chapter stays at this Level until three Chapters are completed at it.",
    reinforcement: grading.result === "struggled" ? "inline-definition"
      : grading.result === "partly-understood" ? "context-clue" : "plain",
  };
  if (recent.length < 3) return decision;

  const average = recent.reduce((sum, session) => sum + session.grading.score, 0) / 3;
  if (average >= 88) {
    if (current === 5) return {
      ...decision, reason: "at-original",
      explanation: "Your last three Chapters show strong understanding. You are already reading the author's original at L5.",
    };
    decision.to = (current + 1) as Level;
    decision.reason = "sustained-understanding";
    decision.explanation = `Your last three Chapters show strong understanding. Your next Chapter moves to L${decision.to}.`;
  } else if (average < 35) {
    if (current === 1) return {
      ...decision, reason: "at-simplest",
      explanation: "Your next Chapter stays at L1, the most simplified Level.",
    };
    decision.to = (current - 1) as Level;
    decision.reason = "sustained-struggle";
    decision.explanation = `Your last three Chapters show you need more support. Your next Chapter moves to L${decision.to}.`;
  } else {
    decision.reason = "sustained-hold";
    decision.explanation = "Your last three Chapters show that more practice at this Level will help. Your next Chapter stays here.";
  }
  return decision;
};
