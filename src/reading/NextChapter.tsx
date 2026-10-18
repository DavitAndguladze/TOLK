"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { nextChapterPollResponse } from "./result";
import controls from "./ui/DesignSystem.module.css";

const POLL_MS = 2000;

const primary = `${controls.button} ${controls.primary} ${controls.fullWidth}`;

/** The result screen's way on: Chapter N+1 once its Chapter Version is ready, the progress view until then. */
export function NextChapter({ versionId, href, chapterNumber }: { versionId: string | null; href: string | null; chapterNumber: number }) {
  const [terminalStatus, setTerminalStatus] = useState<{ versionId: string; status: "ready" | "unavailable" } | null>(null);
  const status = !versionId
    ? "missing"
    : terminalStatus?.versionId === versionId
      ? terminalStatus.status
      : "waiting";

  useEffect(() => {
    if (!versionId) return; // No Chapter Version to wait for, so no polling.
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      const res = await fetch(`/api/chapter-versions/${versionId}`).catch(() => null);
      const step = await nextChapterPollResponse(res);
      if (!live) return;
      if (step === "ready") setTerminalStatus({ versionId, status: "ready" });
      if (step === "stop") setTerminalStatus({ versionId, status: "unavailable" });
      if (step === "wait") timer = setTimeout(poll, POLL_MS);
    };
    void poll();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [versionId]);

  if (status === "ready" && href) {
    return (
      <Link href={href} className={primary}>
        Read Chapter {chapterNumber + 1}
      </Link>
    );
  }
  return (
    <>
      <Link href="/progress" className={primary}>
        See your progress
      </Link>
      <p className="mt-3 text-center text-sm text-fog">
        {status === "missing"
          ? `Chapter ${chapterNumber + 1} isn't available yet.`
          : status === "unavailable"
            ? `Chapter ${chapterNumber + 1} couldn't be prepared.`
            : status === "ready"
              ? "This Chapter is ready, but it can't be opened yet."
              : `Chapter ${chapterNumber + 1} is being prepared.`}
      </p>
    </>
  );
}
