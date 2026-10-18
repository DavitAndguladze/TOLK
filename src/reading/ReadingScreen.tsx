"use client";

import { useState } from "react";
import type { Chunk } from "./chunk";

const button =
  "min-h-13 cursor-pointer rounded-2xl px-4 text-base font-semibold transition outline-light focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100";

export function ReadingScreen({ chunks }: { chunks: Chunk[] }) {
  const [index, setIndex] = useState(0);
  const chunk = chunks[index];

  return (
    <>
      <section aria-label="Chapter text" className="px-6 pt-8 pb-44">
        <p key={chunk.index} className="mx-auto max-w-xl animate-page-in font-book text-[1.5625rem] leading-[1.55] text-pretty">
          {chunk.sentences.map((s) => s.text).join(" ")}
        </p>
      </section>

      <footer className="fixed inset-x-0 bottom-0 border-t border-hairline bg-mist/95 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between text-sm text-fog">
            <p aria-live="polite">
              Part {index + 1} of {chunks.length}
            </p>
            <ol aria-hidden className="flex gap-1.5">
              {chunks.map((c) => (
                <li key={c.index} className={`h-1 w-5 rounded-full ${c.index <= index ? "bg-light" : "bg-hairline"}`} />
              ))}
            </ol>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
              className={`${button} border border-hairline bg-white/60 text-ink hover:bg-white disabled:bg-transparent disabled:text-fog/60`}
            >
              Back
            </button>
            <button
              type="button"
              disabled={index === chunks.length - 1}
              onClick={() => setIndex(index + 1)}
              className={`${button} bg-light text-white hover:bg-[#125f3f] disabled:bg-hairline disabled:text-fog`}
            >
              Next part
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
