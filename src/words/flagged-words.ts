"use client";

import { useSyncExternalStore } from "react";
import type { Api, Token } from "../types";

type FlagResponse = Api["POST /api/chapter-versions/[versionId]/flags"]["res"];

const EMPTY: ReadonlySet<number> = new Set();
const flagged = new Map<string, ReadonlySet<number>>();
const meanings = new Map<string, string>();
const listeners = new Set<() => void>();
// One request at a time, so a quick flag-then-unflag can't reach the server in the wrong order.
let queue: Promise<unknown> = Promise.resolve();

// Same per-browser Reader id as the Chapter Check (src/comprehension/ui/ChapterCheck.tsx) until sign-in (#7).
function readerSessionId(): string {
  try {
    let id = localStorage.getItem("tolk-reader-session");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("tolk-reader-session", id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

function setFlag(chapterVersionId: string, tokenIndex: number, on: boolean) {
  const next = new Set(flagged.get(chapterVersionId));
  if (on) next.add(tokenIndex);
  else next.delete(tokenIndex);
  flagged.set(chapterVersionId, next);
  for (const listener of listeners) listener();
}

function send<T>(chapterVersionId: string, tokenIndex: number, on: boolean, request: () => Promise<Response>): Promise<T> {
  const was = flagged.get(chapterVersionId)?.has(tokenIndex) ?? false;
  setFlag(chapterVersionId, tokenIndex, on);
  const done = queue.then(async () => {
    const res = await request();
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as T;
  });
  queue = done.catch(() => undefined);
  return done.catch((e: unknown) => {
    setFlag(chapterVersionId, tokenIndex, was);
    throw e;
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Token indexes the Reader has flagged in this Chapter Version, kept in sync with every open WordSheet. */
export function useFlaggedWords(chapterVersionId: string): ReadonlySet<number> {
  return useSyncExternalStore(subscribe, () => flagged.get(chapterVersionId) ?? EMPTY, () => EMPTY);
}

export function isFlagged(chapterVersionId: string, tokenIndex: number): boolean {
  return flagged.get(chapterVersionId)?.has(tokenIndex) ?? false;
}

export function knownMeaning(chapterVersionId: string, tokenIndex: number): string | undefined {
  return meanings.get(`${chapterVersionId}:${tokenIndex}`);
}

/** Flags the word and resolves to its in-context meaning. */
export async function flagWord(chapterVersionId: string, token: Token): Promise<string> {
  const { meaning } = await send<FlagResponse>(chapterVersionId, token.index, true, () =>
    fetch(`/api/chapter-versions/${encodeURIComponent(chapterVersionId)}/flags`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Reader-Session": readerSessionId() },
      body: JSON.stringify({ word: token.normalized, tokenIndex: token.index }),
    }),
  );
  meanings.set(`${chapterVersionId}:${token.index}`, meaning);
  return meaning;
}

export async function unflagWord(chapterVersionId: string, token: Token): Promise<void> {
  await send(chapterVersionId, token.index, false, () =>
    fetch(`/api/chapter-versions/${encodeURIComponent(chapterVersionId)}/flags/${token.index}`, {
      method: "DELETE",
      headers: { "X-Reader-Session": readerSessionId() },
    }),
  );
}
