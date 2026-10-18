// Phase 1 evaluation harness for src/leveling/fact-verification.ts (docs/research/fact-verification-evaluation.md).
// Makes real OCI Generative AI calls - run deliberately, not as part of `npm test`.
// Usage: node --env-file-if-exists=.env.local scripts/evaluate-fact-verification.mjs
import { splitOriginalSentences } from "../src/leveling/content.ts";
import content from "../src/data/gatsby/content.json" with { type: "json" };
import candidate from "../docs/research/ch1-l1-review/candidate.json" with { type: "json" };
import { createOciChat } from "../src/comprehension/oci-chat.ts";
import { isSelfContradictory, verifyFactStrategyA, verifyFactStrategyB } from "../src/leveling/fact-verification.ts";

const ch1 = content.chapters.find((c) => c.number === 1);
const original = splitOriginalSentences(ch1.originalText);
const sents = candidate.draft.sentences;
const WINDOW = 3; // sentences of immediate context before the cited index, not the whole chapter

function servedWindow(originalIndex) {
  return sents.filter((s) => s.originalSentenceIndex >= originalIndex - WINDOW && s.originalSentenceIndex <= originalIndex)
    .map((s) => s.text).join(" ");
}
function originalWindow(originalIndex) {
  return original.slice(Math.max(0, originalIndex - WINDOW), originalIndex + 1).join(" ");
}
function toFact({ factId, claim, idx, served }) {
  return { factId, claim, originalPassage: originalWindow(idx), servedPassage: served ?? servedWindow(idx) };
}

// 5 real, human-reviewed Key Points, unmodified.
const keyPointFacts = [
  { factId: "kp1-good", claim: ch1.keyPoints[0].text, idx: 1 },
  { factId: "kp2-good", claim: ch1.keyPoints[1].text, idx: 45 },
  { factId: "kp3-good", claim: ch1.keyPoints[2].text, idx: 51 },
  { factId: "kp4-good", claim: ch1.keyPoints[3].text, idx: 236 },
  { factId: "kp5-good", claim: ch1.keyPoints[4].text, idx: 360 },
].map(toFact);

// 5 ordinary, already-editorially-reviewed correct passages NOT tied to any curated Key Point -
// tests the false-alarm rate on content outside the 5 facts this method can even see.
const ordinaryGoodFacts = [
  { factId: "ordinary-100", idx: 100, claim: "Daisy's voice has an exciting quality that men who loved her found hard to forget." },
  { factId: "ordinary-130", idx: 130, claim: "Miss Baker was surprised at her own sudden outburst, then got up quickly." },
  { factId: "ordinary-199", idx: 199, claim: "Tom's growing self-satisfaction does not seem to satisfy him as much as it used to." },
  { factId: "ordinary-278", idx: 278, claim: "Daisy says she hopes her daughter will be a beautiful fool, since that is the best thing a girl can be in this world." },
  { factId: "ordinary-349", idx: 349, claim: "Nick felt confused and a little sick as he drove away, even though the Buchanans' interest in him felt good." },
].map(toFact);

// 10 deliberately broken facts spanning different error types, each one real edit of a real window.
const brokenFacts = [
  { factId: "broken-negation-1", claim: ch1.keyPoints[0].text, idx: 1,
    served: servedWindow(1).replace("Not everyone has had the good things you have had.", "Everyone has had the good things you have had.") },
  { factId: "broken-person-swap", claim: ch1.keyPoints[3].text, idx: 236,
    served: servedWindow(236).replace("Tom has another woman in New York.", "Nick has another woman in New York.") },
  { factId: "broken-descriptor-flip", claim: ch1.keyPoints[1].text, idx: 45,
    served: servedWindow(45).replace("It was, well, the less fashionable of the two.", "It was, well, the more fashionable of the two.") },
  { factId: "broken-dropped-event-1", claim: ch1.keyPoints[2].text, idx: 51, served: "I went to sleep early that night." },
  { factId: "broken-invented-1", claim: ch1.keyPoints[4].text, idx: 360, served: servedWindow(360) + " A dog barked loudly nearby." },
  { factId: "broken-dropped-event-2", claim: ch1.keyPoints[0].text, idx: 1, served: "He said nothing." },
  { factId: "broken-location-swap-1", claim: ch1.keyPoints[1].text, idx: 45,
    served: servedWindow(45).replace("I made my home at West Egg.", "Nick made his home at East Egg.") },
  { factId: "broken-invented-2", claim: ch1.keyPoints[3].text, idx: 236, served: "Tom confessed this to Daisy. " + servedWindow(236) },
  { factId: "broken-negation-2", claim: ch1.keyPoints[4].text, idx: 360,
    served: servedWindow(360).replace("I saw only one little green light far away.", "I did not see any green light.") },
  { factId: "broken-location-swap-2", claim: ch1.keyPoints[2].text, idx: 51,
    served: servedWindow(51).replace("I drove to East Egg for dinner with the Buchanans.", "I drove to West Egg for dinner with the Buchanans.") },
].map(toFact);

// Sanity: a broken fixture's served passage must actually differ from the real candidate's text at that index.
const brokenSourceIndexes = [1, 236, 45, 51, 360, 1, 45, 236, 360, 51];
brokenFacts.forEach((b, i) => {
  if (b.servedPassage === servedWindow(brokenSourceIndexes[i])) throw new Error(`Broken fixture ${b.factId} did not actually change anything`);
});

const chat = createOciChat();
if (!chat) throw new Error("OCI configuration or its private-key file is missing; set the OCI_* variables from .env.example.");
let callCount = 0;
const generateText = async (prompt, options) => { callCount++; return chat(prompt, { maxTokens: 500, json: true, signal: options?.signal }); };

async function runSet(facts, expectBroken) {
  const rows = [];
  for (const fact of facts) {
    const a = await verifyFactStrategyA(fact, generateText);
    const b = await verifyFactStrategyB(fact, generateText);
    const aCorrect = expectBroken ? a.verdict !== "preserved" : a.verdict === "preserved";
    const bCorrect = expectBroken ? b.verdict !== "preserved" : b.verdict === "preserved";
    rows.push({ factId: fact.factId, expectBroken, aVerdict: a.verdict, aCorrect, bVerdict: b.verdict, bCorrect,
      bCalls: b.results.length, aContradictions: a.results.filter(isSelfContradictory).length });
    console.log(`${fact.factId}: A=${a.verdict}(${aCorrect ? "OK" : "WRONG"}) B=${b.verdict}(${bCorrect ? "OK" : "WRONG"}, ${b.results.length} calls)`);
  }
  return rows;
}

console.log("=== GOOD facts (expect preserved) ===");
const goodRows = await runSet([...keyPointFacts, ...ordinaryGoodFacts], false);
console.log("\n=== BROKEN facts (expect NOT preserved) ===");
const brokenRows = await runSet(brokenFacts, true);
console.log(`\nTotal real OCI calls: ${callCount}`);
console.log(JSON.stringify({ goodRows, brokenRows, callCount }, null, 2));
