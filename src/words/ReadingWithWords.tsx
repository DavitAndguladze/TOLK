"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LevelLadder } from "../reading/LevelLadder";
import { LevelSelect } from "../reading/LevelSelect";
import { ReadingScreen } from "../reading/ReadingScreen";
import type { Chunk } from "../reading/chunk";
import type { Level, Token } from "../types";
import { createFlagScope, disposeFlags, loadFlags, useFlaggedWords } from "./flagged-words";
import { WordSheet } from "./WordSheet";

/** One stored Version of the current Chapter the Reader can switch to with the Level selector. */
export interface LevelOption { versionId: string; level: Level; chunks: Chunk[] }

/** Server parents pass serializable reading data and the Chapter Check slot. With `levels`, the Reader can read
 *  the same Chapter at another stored Level; the Chapter Check, completion and progress stay on the assigned one. */
export function ReadingWithWords({ chapterVersionId: assignedId, readerId, chunks: assignedChunks, chapterCheck, completed, levels }: {
  chapterVersionId: string; readerId?: string; chunks: Chunk[]; chapterCheck?: ReactNode; completed?: boolean; levels?: LevelOption[];
}) {
  const assigned = levels?.find((option) => option.versionId === assignedId);
  const levelKey = readerId ? `tolk-reading-level:${encodeURIComponent(readerId)}:${encodeURIComponent(assignedId)}` : null;
  const [chosenLevel, setChosenLevel] = useState<Level | null>(null);
  // Keep the chosen Level for this tab's reading session; restored after mount so server and client render alike.
  useEffect(() => {
    try {
      const saved = Number(levelKey && sessionStorage.getItem(levelKey));
      if (levels?.some((option) => option.level === saved)) setChosenLevel(saved as Level);
    } catch { /* Storage may be blocked; the assigned Level still shows. */ }
  }, [levelKey, levels]);
  const choose = (level: Level) => {
    setChosenLevel(level);
    try { if (levelKey) sessionStorage.setItem(levelKey, String(level)); } catch { /* Optional convenience. */ }
  };
  const shown = levels?.find((option) => option.level === chosenLevel) ?? assigned;
  const chapterVersionId = shown?.versionId ?? assignedId;
  const chunks = shown?.chunks ?? assignedChunks;
  const previewing = assigned !== undefined && shown !== assigned;
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
    {assigned && shown && levels && (
      <div className="mx-auto max-w-xl px-6">
        <LevelLadder current={shown.level} showLabel={false} />
        <LevelSelect value={shown.level} assigned={assigned.level} available={new Set(levels.map((option) => option.level))} onChange={choose} />
        {previewing && <div className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-fog">
          <p role="status">Reading at Level {shown.level} to compare. Your Chapter Check and progress stay at Level {assigned.level}.</p>
          <button type="button" onClick={() => choose(assigned.level)} className="min-h-11 cursor-pointer font-semibold text-light underline outline-light focus-visible:outline-2">Back to Level {assigned.level}</button>
        </div>}
      </div>
    )}
    {!ready && <p role={failed ? "alert" : "status"} className="mx-auto max-w-xl px-6 pt-4 text-sm text-fog">
      {failed ? <>Saved words couldn’t load. You can keep reading. <button type="button" onClick={() => setAttempt((n) => n + 1)} className="min-h-11 cursor-pointer font-semibold text-light underline outline-light focus-visible:outline-2">Retry saved words</button></> : "Loading saved words…"}
    </p>}
    <ReadingScreen chapterVersionId={chapterVersionId} readerId={readerId} chunks={chunks} chapterCheck={chapterCheck} completed={completed && !previewing} onWordTap={ready ? setSelected : undefined} flaggedTokenIndexes={ready ? flags : undefined} />
    {selected && <WordSheet key={`${chapterVersionId}:${selected.index}`} chapterVersionId={chapterVersionId} token={selected} flagScope={flagScope} canFlag={!previewing} onClose={() => setSelected(null)} />}
  </>;
}
