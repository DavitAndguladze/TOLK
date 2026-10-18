"use client";

import { Fragment, useEffect, useState } from "react";
import type { ChapterVersion, Token } from "../types";
import { createFlagScope, disposeFlags, useFlaggedWords } from "./flagged-words";
import { WordSheet } from "./WordSheet";

/** Stand-in for R2's tappable words (request 0008) so the WordSheet can be tried on its own. */
export function WordsDemo({ version }: { version: ChapterVersion }) {
  const [tapped, setTapped] = useState<Token | null>(null);
  const [flagScope, setFlagScope] = useState(createFlagScope);
  const flagged = useFlaggedWords(version.id, flagScope);
  useEffect(() => {
    const mounted = createFlagScope();
    setFlagScope(mounted);
    setTapped(null);
    return () => disposeFlags(mounted);
  }, [version.id]);

  return (
    <>
      <p className="mx-auto max-w-xl font-book text-[1.5625rem] leading-[1.7] text-pretty">
        {version.tokens.map((token, i) => (
          <Fragment key={token.index}>
            {i > 0 && " "}
            <button
              type="button"
              onClick={() => setTapped(token)}
              className={`-mx-0.5 cursor-pointer rounded-md px-0.5 outline-light hover:bg-white/70 focus-visible:outline-2 ${
                flagged.has(token.index) ? "bg-gold/15 underline decoration-gold decoration-dotted decoration-2 underline-offset-[7px]" : ""
              }`}
            >
              {token.text}
              {flagged.has(token.index) && <span className="sr-only"> (flagged)</span>}
            </button>
          </Fragment>
        ))}
      </p>
      {tapped && <WordSheet key={tapped.index} chapterVersionId={version.id} token={tapped} flagScope={flagScope} onClose={() => setTapped(null)} />}
    </>
  );
}
