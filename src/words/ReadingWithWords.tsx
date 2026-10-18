"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ReadingScreen } from "../reading/ReadingScreen";
import type { Chunk } from "../reading/chunk";
import type { Token } from "../types";
import { createFlagScope, disposeFlags, loadFlags, useFlaggedWords } from "./flagged-words";
import { WordSheet } from "./WordSheet";

/** Server parents pass serializable reading data and the Chapter Check slot. */
export function ReadingWithWords({ chapterVersionId, readerId, chunks, chapterCheck, completed }: { chapterVersionId: string; readerId?: string; chunks: Chunk[]; chapterCheck?: ReactNode; completed?: boolean }) {
  const [flagScope] = useState(createFlagScope);
  const flags = useFlaggedWords(chapterVersionId, flagScope);
  const [selected, setSelected] = useState<Token | null>(null);
  const [loadedVersion, setLoadedVersion] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setSelected(null);
    setLoadedVersion(null);
    setFailed(false);
    loadFlags(chapterVersionId, flagScope).then(
      () => live && setLoadedVersion(chapterVersionId),
      () => live && setFailed(true),
    );
    return () => { live = false; disposeFlags(flagScope); };
  }, [chapterVersionId, attempt, flagScope]);
  const ready = loadedVersion === chapterVersionId;
  return <>
    {!ready && <p role={failed ? "alert" : "status"} className="mx-auto max-w-xl px-6 pt-4 text-sm text-fog">
      {failed ? <>Saved words couldn’t load. You can keep reading. <button type="button" onClick={() => setAttempt((n) => n + 1)} className="min-h-11 cursor-pointer font-semibold text-light underline outline-light focus-visible:outline-2">Retry saved words</button></> : "Loading saved words…"}
    </p>}
    <ReadingScreen chapterVersionId={chapterVersionId} readerId={readerId} chunks={chunks} chapterCheck={chapterCheck} completed={completed} onWordTap={ready ? setSelected : undefined} flaggedTokenIndexes={ready ? flags : undefined} />
    {selected && <WordSheet key={`${chapterVersionId}:${selected.index}`} chapterVersionId={chapterVersionId} token={selected} flagScope={flagScope} onClose={() => setSelected(null)} />}
  </>;
}
