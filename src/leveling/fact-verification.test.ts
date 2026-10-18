import { describe, expect, it } from "vitest";
import {
  buildFactVerificationPrompt, isSelfContradictory, parseFactVerification, resolveStrategyA, resolveStrategyB,
  verifyFactStrategyA, verifyFactStrategyB, type Fact, type FactVerification,
} from "./fact-verification.ts";

const fact: Fact = {
  factId: "kp4", claim: "Miss Baker tells Nick that Tom has another woman in New York.",
  originalPassage: "“Tom’s got some woman in New York.”",
  servedPassage: "\"Tom has another woman in New York.\"",
};

function verification(overrides: Partial<FactVerification> = {}): FactVerification {
  return { factId: fact.factId, originalPassage: fact.originalPassage, servedPassage: fact.servedPassage,
    explanation: "The served passage preserves the original claim exactly.", verdict: "preserved", ...overrides };
}

describe("buildFactVerificationPrompt", () => {
  it("embeds the claim and both passages", () => {
    const prompt = buildFactVerificationPrompt(fact);
    expect(prompt).toContain(fact.claim);
    expect(prompt).toContain(fact.originalPassage);
    expect(prompt).toContain(fact.servedPassage);
  });

  it("puts verdict before explanation in the requested JSON shape by default", () => {
    const prompt = buildFactVerificationPrompt(fact);
    expect(prompt.indexOf('"verdict"')).toBeLessThan(prompt.indexOf('"explanation"'));
  });

  it("puts explanation before verdict when verdictFirst is false, for the field-order experiment", () => {
    const prompt = buildFactVerificationPrompt(fact, { verdictFirst: false });
    expect(prompt.indexOf('"explanation"')).toBeLessThan(prompt.indexOf('"verdict"'));
  });

  it("tells the model style loss alone is not a failure", () => {
    expect(buildFactVerificationPrompt(fact)).toMatch(/not a failure/i);
  });
});

describe("parseFactVerification", () => {
  it("accepts a well-formed response", () => {
    const result = parseFactVerification({ verdict: "changed", explanation: "The negation was reversed." }, fact);
    expect(result).toEqual({ factId: fact.factId, originalPassage: fact.originalPassage, servedPassage: fact.servedPassage,
      explanation: "The negation was reversed.", verdict: "changed" });
  });

  it("falls back to uncertain, not a throw, when the response isn't an object", () => {
    const result = parseFactVerification("not json", fact);
    expect(result.verdict).toBe("uncertain");
    expect(result.factId).toBe(fact.factId);
  });

  it("falls back to uncertain when verdict is missing or not one of the four values", () => {
    expect(parseFactVerification({ explanation: "fine" }, fact).verdict).toBe("uncertain");
    expect(parseFactVerification({ verdict: "approved", explanation: "fine" }, fact).verdict).toBe("uncertain");
  });

  it("falls back to uncertain when explanation is missing or empty", () => {
    expect(parseFactVerification({ verdict: "preserved", explanation: "" }, fact).verdict).toBe("uncertain");
    expect(parseFactVerification({ verdict: "preserved" }, fact).verdict).toBe("uncertain");
  });
});

describe("isSelfContradictory", () => {
  it("flags the exact real failure case: verdict false-ish but the explanation concludes it's actually preserved", () => {
    const result = verification({
      verdict: "changed",
      explanation: "The original passage states X. The served passage says Y, which is different. However, "
        + "the core event is the same, so upon closer inspection, it is actually preserved.",
    });
    expect(isSelfContradictory(result)).toBe(true);
  });

  it("does not flag a genuinely consistent preserved verdict", () => {
    expect(isSelfContradictory(verification({ verdict: "preserved",
      explanation: "The served passage states the same fact as the original, with the same people and relationship. It is preserved." }))).toBe(false);
  });

  it("does not flag a genuinely consistent changed verdict", () => {
    expect(isSelfContradictory(verification({ verdict: "changed",
      explanation: "The served passage says 'has no other woman', reversing the original's claim. This is incorrect and reverses the meaning." }))).toBe(false);
  });

  it("flags a preserved verdict whose explanation concludes the claim is wrong", () => {
    expect(isSelfContradictory(verification({ verdict: "preserved",
      explanation: "At first the wording looks the same. But the final clause contradicts the original and is incorrect." }))).toBe(true);
  });

  it("does not flag an explanation with no clear concluding cue either way (documented limitation: ambiguous cases pass through)", () => {
    expect(isSelfContradictory(verification({ verdict: "uncertain",
      explanation: "The passages are similar in most respects, with some differences in wording and emphasis." }))).toBe(false);
  });
});

describe("resolveStrategyA", () => {
  it("requires exactly 3 results", () => {
    expect(() => resolveStrategyA([verification()])).toThrow("exactly 3");
  });

  it("returns the unanimous verdict when all 3 agree and none is self-contradictory", () => {
    expect(resolveStrategyA([verification(), verification(), verification()])).toBe("preserved");
  });

  it("returns uncertain on a split verdict", () => {
    expect(resolveStrategyA([verification({ verdict: "preserved" }), verification({ verdict: "preserved" }), verification({ verdict: "changed" })])).toBe("uncertain");
  });

  it("returns uncertain when any one of the 3 is self-contradictory, even if the other two agree", () => {
    const contradictory = verification({ verdict: "changed", explanation: "...so upon closer inspection, it is actually preserved." });
    expect(resolveStrategyA([verification(), verification(), contradictory])).toBe("uncertain");
  });
});

describe("resolveStrategyB", () => {
  it("accepts a clean first result with no further checks needed", () => {
    expect(resolveStrategyB([verification()])).toEqual({ verdict: "preserved", needMore: false });
  });

  it("asks for more when the first result is uncertain", () => {
    expect(resolveStrategyB([verification({ verdict: "uncertain" })])).toEqual({ verdict: "uncertain", needMore: true });
  });

  it("asks for more when the first result is self-contradictory even if its stated verdict looks confident", () => {
    const contradictory = verification({ verdict: "changed", explanation: "...so upon closer inspection, it is actually preserved." });
    expect(resolveStrategyB([contradictory])).toEqual({ verdict: "uncertain", needMore: true });
  });

  it("stops at 2 once the second result agrees with a non-contradictory first", () => {
    const first = verification({ verdict: "uncertain" });
    const second = verification({ verdict: "changed" });
    expect(resolveStrategyB([first, second])).toEqual({ verdict: "changed", needMore: false });
  });

  it("resolves by majority after exhausting 3 checks with no clean stop", () => {
    const results = [verification({ verdict: "uncertain" }), verification({ verdict: "changed" }), verification({ verdict: "changed" })];
    expect(resolveStrategyB(results)).toEqual({ verdict: "changed", needMore: false });
  });

  it("falls back to uncertain after 3 checks with no usable majority", () => {
    const contradictory = verification({ verdict: "preserved", explanation: "...but this contradicts the original and is incorrect." });
    const results = [verification({ verdict: "uncertain" }), contradictory, verification({ verdict: "uncertain" })];
    expect(resolveStrategyB(results).verdict).toBe("uncertain");
  });

  it("rejects an empty or over-long result array", () => {
    expect(() => resolveStrategyB([])).toThrow();
    expect(() => resolveStrategyB([verification(), verification(), verification(), verification()])).toThrow();
  });
});

describe("verifyFactStrategyA (mocked generateText, no network)", () => {
  it("runs exactly 3 calls and resolves via resolveStrategyA", async () => {
    let calls = 0;
    const generateText = async () => { calls++; return JSON.stringify({ verdict: "preserved", explanation: "Matches." }); };
    const outcome = await verifyFactStrategyA(fact, generateText);
    expect(calls).toBe(3);
    expect(outcome.verdict).toBe("preserved");
    expect(outcome.results).toHaveLength(3);
  });
});

describe("verifyFactStrategyB (mocked generateText, no network)", () => {
  it("makes only 1 call when the first result is clean", async () => {
    let calls = 0;
    const generateText = async () => { calls++; return JSON.stringify({ verdict: "preserved", explanation: "Matches." }); };
    const outcome = await verifyFactStrategyB(fact, generateText);
    expect(calls).toBe(1);
    expect(outcome.verdict).toBe("preserved");
  });

  it("escalates up to 3 calls when earlier results are uncertain", async () => {
    const replies = [
      { verdict: "uncertain", explanation: "Not sure." },
      { verdict: "changed", explanation: "The negation was reversed." },
    ];
    let calls = 0;
    const generateText = async () => { const reply = replies[calls] ?? replies.at(-1)!; calls++; return JSON.stringify(reply); };
    const outcome = await verifyFactStrategyB(fact, generateText);
    expect(calls).toBe(2);
    expect(outcome.verdict).toBe("changed");
  });
});
