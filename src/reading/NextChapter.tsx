"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { nextChapterPollResponse, nextChapterRetryResponse } from "./result";
import { Button } from "./ui/Button";
import controls from "./ui/DesignSystem.module.css";

const POLL_MS = 2000;

const primary = `${controls.button} ${controls.primary} ${controls.fullWidth}`;

/** The result screen's way on: Chapter N+1 once its Chapter Version is ready, the progress view until then. */
export function NextChapter({ versionId, href, chapterNumber }: { versionId: string | null; href: string | null; chapterNumber: number }) {
  const [terminalStatus, setTerminalStatus] = useState<{ versionId: string; status: "ready" | "unavailable" | "retry" | "retrying" | "exhausted" } | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);
  const retryRequest = useRef<AbortController | null>(null);
  const status = !versionId
    ? "missing"
    : terminalStatus?.versionId === versionId
      ? terminalStatus.status
      : "waiting";

  useEffect(() => {
    return () => {
      retryRequest.current?.abort();
      retryRequest.current = null;
    };
  }, [versionId]);

  useEffect(() => {
    if (!versionId) return; // No Chapter Version to wait for, so no polling.
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      const res = await fetch(`/api/chapter-versions/${encodeURIComponent(versionId)}`, { cache: "no-store" }).catch(() => null);
      const step = await nextChapterPollResponse(res);
      if (!live) return;
      if (step === "ready") setTerminalStatus({ versionId, status: "ready" });
      if (step === "stop") setTerminalStatus({ versionId, status: "unavailable" });
      if (step === "retry") setTerminalStatus({ versionId, status: "retry" });
      if (step === "wait") timer = setTimeout(poll, POLL_MS);
    };
    void poll();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [versionId, pollAttempt]);

  const retry = async () => {
    if (!versionId || retryRequest.current) return;
    const request = new AbortController();
    retryRequest.current = request;
    setTerminalStatus({ versionId, status: "retrying" });
    const response = await fetch(`/api/chapter-versions/${encodeURIComponent(versionId)}/retry`, {
      method: "POST", credentials: "same-origin", cache: "no-store", signal: request.signal,
    }).catch(() => null);
    const step = await nextChapterRetryResponse(response);
    if (request.signal.aborted) return;
    retryRequest.current = null;
    if (step === "wait") {
      setTerminalStatus(null);
      setPollAttempt(attempt => attempt + 1);
    } else {
      setTerminalStatus({ versionId, status: step === "stop" ? "unavailable" : step });
    }
  };

  if (status === "ready" && href) {
    return (
      <Link href={href} className={primary}>
        Read Chapter {chapterNumber + 1}
      </Link>
    );
  }
  return (
    <>
      {(status === "retry" || status === "retrying") && <Button className="mb-3" fullWidth loading={status === "retrying"} onClick={() => void retry()}>Try preparing Chapter {chapterNumber + 1} again</Button>}
      <Link href="/progress" className={primary}>
        See your progress
      </Link>
      <p role="status" className="mt-3 text-center text-sm text-fog">
        {status === "missing"
          ? `Chapter ${chapterNumber + 1} isn't available yet.`
          : status === "exhausted"
            ? "No preparation retries remain. Your Chapter result is saved. You can return to your Library or Progress."
          : status === "retry"
            ? `Chapter ${chapterNumber + 1} couldn't be prepared. Your result is saved; you can try again when you're ready.`
          : status === "retrying"
            ? `Trying to prepare Chapter ${chapterNumber + 1}. Your result is saved.`
          : status === "unavailable"
            ? `Chapter ${chapterNumber + 1} couldn't be prepared.`
            : status === "ready"
              ? "This Chapter is ready, but it can't be opened yet."
              : `Chapter ${chapterNumber + 1} is being prepared.`}
      </p>
    </>
  );
}
