"use client";

import { useEffect, useState } from "react";
import type { Level } from "../types";
import { LevelLadder } from "./LevelLadder";
import motion from "./ReadingMotion.module.css";

/** The Level change moment: the ladder starts at the Chapter just read and moves to the next Chapter's Level. */
export function LevelChange({ from, to }: { from: Level; to: Level }) {
  const [shown, setShown] = useState(from);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setShown(from);
    setRevealed(false);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false) {
      setShown(to);
      setRevealed(true);
      return;
    }
    const timer = setTimeout(() => {
      setShown(to);
      setRevealed(true);
    }, 700);
    return () => clearTimeout(timer);
  }, [from, to]);
  const motionClass = to > from ? motion.levelUp : to < from ? motion.levelDown : "";
  return (
    <div className={motionClass} data-revealed={revealed ? "true" : undefined}>
      <LevelLadder current={shown} />
    </div>
  );
}
