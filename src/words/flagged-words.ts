"use client";

import { useSyncExternalStore } from "react";
import type { Api, Token } from "../types";

type FlagResponse = Api["POST /api/chapter-versions/[versionId]/flags"]["res"];

const EMPTY: ReadonlySet<number> = new Set();
const flagged = new Map<string, ReadonlySet<number>>();
const meanings = new Map<string, string>();
const listeners = new Set<() => void>();
// One request at a time per word, so a quick flag-then-unflag can't reach the server in the wrong order.
const queues = new Map<string, Promise<unknown>>();

const keyOf = (chapterVersionId: string, tokenIndex: number) => `${chapterVersionId}:${tokenIndex}`;

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

function send<T>(chapterVersionId: string, tokenIndex: number, on: boolean, url: string, init: RequestInit): Promise<T> {
  const was = isFlagged(chapterVersionId, tokenIndex);
  setFlag(chapterVersionId, tokenIndex, on);
  const key = keyOf(chapterVersionId, tokenIndex);
  const done = (queues.get(key) ?? Promise.resolve()).then(async () => {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as T;
  });
  queues.set(key, done.catch(() => undefined));
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
  return meanings.get(keyOf(chapterVersionId, tokenIndex));
}

const flagsUrl = (chapterVersionId: string) => `/api/chapter-versions/${encodeURIComponent(chapterVersionId)}/flags`;

/** Flags the word and resolves to its in-context meaning. */
export async function flagWord(chapterVersionId: string, token: Token): Promise<string> {
  const { meaning } = await send<FlagResponse>(chapterVersionId, token.index, true, flagsUrl(chapterVersionId), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Reader-Session": readerSessionId() },
    body: JSON.stringify({ word: token.normalized, tokenIndex: token.index }),
  });
  meanings.set(keyOf(chapterVersionId, token.index), meaning);
  return meaning;
}

export async function unflagWord(chapterVersionId: string, token: Token): Promise<void> {
  await send(chapterVersionId, token.index, false, `${flagsUrl(chapterVersionId)}/${token.index}`, {
    method: "DELETE",
    headers: { "X-Reader-Session": readerSessionId() },
  });
}
