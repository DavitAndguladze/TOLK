import { mockChapterVersion } from "@/mocks";
import { WordsDemo } from "@/words/WordsDemo";

// Tries the WordSheet on the author's original (L5), where the Chapter's Complex Words appear, until R2 wires word taps into reading.
export default function WordsDemoPage() {
  return (
    <main className="min-h-dvh px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-16">
      <p className="mx-auto mb-6 max-w-xl text-fog">Tap any word you don't know.</p>
      <WordsDemo version={mockChapterVersion(5)} />
    </main>
  );
}
