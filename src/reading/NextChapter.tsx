"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Api } from "../types";
import { nextChapterPoll } from "./result";

const POLL_MS = 2000;

const primary =
  "flex min-h-13 items-center justify-center rounded-2xl bg-light px-4 font-semibold text-white outline-light transition hover:bg-[#125f3f] focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]";

/** The result screen's way on: Chapter N+1 once its Chapter Version is ready, the progress view until then. */
export function NextChapter({ versionId, href, chapterNumber }: { versionId: string | null; href: string | null; chapterNumber: number }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!versionId) return; // No Chapter Version to wait for, so no polling.
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      const res = await fetch(`/api/chapter-versions/${versionId}`).catch(() => null);
      const version = res?.ok ? ((await res.json()) as Api["GET /api/chapter-versions/[versionId]"]["res"]) : null;
      const step = nextChapterPoll(res?.status ?? 0, version);
      if (!live) return;
      if (step === "ready") setReady(true);
      if (step === "wait") timer = setTimeout(poll, POLL_MS);
    };
    void poll();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [versionId]);

  if (ready && href) {
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
      <p className="mt-3 text-center text-sm text-fog">Chapter {chapterNumber + 1} is on its way.</p>
    </>
  );
}
