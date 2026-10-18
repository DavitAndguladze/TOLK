"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Counts the visible Chapter score up while exposing only its final value to assistive technology. */
export function ScoreCountUp({ score }: { score: number }) {
  const [shown, setShown] = useState(score);

  useIsomorphicLayoutEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false) {
      setShown(score);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 650, 1);
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(score * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    setShown(0);
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [score]);

  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{score} out of 100</span>
    </>
  );
}
