import type { KeyPointGrader } from "./grade-check";

const STOP_WORDS = new Set(["that", "this", "with", "have", "other", "same", "about", "from", "they", "them", "their", "there", "what", "when", "were", "been", "into", "than", "then"]);

/** Words of 4+ letters that carry meaning, cut to 5 letters so "criticizing" matches "criticize". */
function meaningfulStems(text: string): Set<string> {
  const words = text.toLowerCase().replace(/'s\b/g, "").match(/[a-z']+/g) ?? [];
  return new Set(words.filter((w) => w.length >= 4 && !STOP_WORDS.has(w)).map((w) => w.slice(0, 5)));
}

/**
 * Deterministic stand-in for OCI Generative AI: grades by how many of the Key Point's words the
 * answer uses. Half or more → 2, any → 1, none → 0. Also the fallback when OCI can't be reached.
 */
export const mockKeyPointGrader: KeyPointGrader = async ({ keyPoint, answer }) => {
  const expected = meaningfulStems(keyPoint.text);
  const given = meaningfulStems(answer);
  const shared = [...expected].filter((stem) => given.has(stem)).length;

  if (shared * 2 >= expected.size && shared > 0) return { grade: 2, feedback: "Yes, that's it.", gradedBy: "stand-in" };
  if (shared > 0) return { grade: 1, feedback: `Partly. The chapter says: ${keyPoint.text}`, gradedBy: "stand-in" };
  return { grade: 0, feedback: `Not quite. The chapter says: ${keyPoint.text}`, gradedBy: "stand-in" };
};
