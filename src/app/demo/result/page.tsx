import type { LevelDecision } from "@/types";
import { mockDecision, mockGrading, mockSession, mockWordBank } from "@/mocks";
import { ResultScreen, type AnswersResult } from "@/reading/ResultScreen";

// Preview of the result screen for each Level decision until the Chapter Check (#11) and grading (#12) land.
const CASES: Record<string, { decision: LevelDecision; grading?: Partial<AnswersResult["session"]["grading"]> }> = {
  same: { decision: mockDecision },
  up: {
    decision: { from: 1, to: 2, reason: "fully-understood", explanation: "You understood it well, so the next Chapter moves one Level closer to the original.", reinforcement: "plain" },
    grading: { barelyPassed: false, score: 92 },
  },
  down: {
    decision: { from: 2, to: 1, reason: "struggled-down", explanation: "That one was hard. The next Chapter is one Level simpler, with short definitions for new words.", reinforcement: "inline-definition" },
    grading: { result: "struggled", barelyPassed: false, score: 31 },
  },
  original: {
    decision: { from: 4, to: 5, reason: "fully-understood", explanation: "You're ready. The next Chapter is the author's original text.", reinforcement: "plain" },
    grading: { barelyPassed: false, score: 95 },
  },
};

export default async function ResultDemoPage({ searchParams }: { searchParams: Promise<{ case?: string }> }) {
  const requested = (await searchParams).case ?? "up";
  const { decision, grading } = Object.hasOwn(CASES, requested) ? CASES[requested] : CASES.up;
  const result: AnswersResult = {
    session: { ...mockSession, grading: { ...mockGrading, ...grading } },
    decision,
    wordBank: { bank: mockWordBank, graduatedThisChapter: ["vulnerable"], wordsLearnedTotal: 7 },
    nextVersionId: null, // as the answers route returns until next-Chapter generation (#14) lands
  };
  return (
    <main className="min-h-full">
      <ResultScreen result={result} nextHref={null} />
    </main>
  );
}
