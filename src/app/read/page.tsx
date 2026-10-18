// Temporary reading screen for ticket #3: the mock Chapter Version at any Level,
// one Sentence per chunk. R2 owns this screen and replaces it (#8 highlighting).
import Link from "next/link";
import { LEVEL_SPECS, mockChapterVersion } from "@/mocks";
import { LEVELS, type Level } from "@/types";

export default async function ReadPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const requested = Number((await searchParams).level);
  const level: Level = LEVELS.includes(requested as Level) ? (requested as Level) : 1;
  const version = mockChapterVersion(level);

  return (
    <main>
      <nav aria-label="Level switch (temporary)">
        {LEVELS.map((l) => (
          <Link key={l} href={`/read?level=${l}`} aria-current={l === level ? "page" : undefined}>
            L{l}{" "}
          </Link>
        ))}
      </nav>
      <h1>Chapter {version.chapterNumber} · L{level}: {LEVEL_SPECS[level].label}</h1>
      {version.sentences.map((s) => (
        <p key={s.index}>{s.text}</p>
      ))}
    </main>
  );
}
