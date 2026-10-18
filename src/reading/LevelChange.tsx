"use client";

import { useEffect, useState } from "react";
import type { Level } from "../types";
import { LevelLadder } from "./LevelLadder";

/** The Level change moment: the ladder starts at the Chapter just read and moves to the next Chapter's Level. */
export function LevelChange({ from, to }: { from: Level; to: Level }) {
  const [shown, setShown] = useState(from);
  useEffect(() => {
    const timer = setTimeout(() => setShown(to), 700);
    return () => clearTimeout(timer);
  }, [to]);
  return <LevelLadder current={shown} />;
}
