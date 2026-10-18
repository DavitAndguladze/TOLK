"use client";

import { useSyncExternalStore } from "react";
import type { Api, FlaggedWord, Token } from "../types";
import type { WordMeaning } from "./meaning";

type FlagResponse = Api["POST /api/chapter-versions/[versionId]/flags"]["res"];

const EMPTY: ReadonlySet<number> = new Set();
const flagged = new Map<string, ReadonlySet<number>>();
const listeners = new Set<() => void>();
// One request at a time per word, so a quick flag-then-unflag can't reach the server in the wrong order.
const queues = new Map<string, Promise<unknown>>();
const loading = new Map<string, symbol>();

const keyOf = (chapterVersionId: string, tokenIndex: number) => `${chapterVersionId}:${tokenIndex}`;

function setFlag(chapterVersionId: string, tokenIndex: number, on: boolean) {
  const next = new Set(flagged.get(chapterVersionId));
  if (on) next.add(tokenIndex);
  else next.delete(tokenIndex);
  flagged.set(chapterVersionId, next);
  for (const listener of listeners) listener();
}

function send<T>(chapterVersionId: string, tokenIndex: number, on: boolean, url: string, init: RequestInit): Promise<T> {
  const key = keyOf(chapterVersionId, tokenIndex);
  const done = (queues.get(key) ?? Promise.resolve()).then(async () => {
    const res = await fetch(url, { ...init, credentials: "same-origin", signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    if (on ? data?.flagged?.tokenIndex !== tokenIndex || data?.flagged?.chapterVersionId !== chapterVersionId || typeof data?.meaning !== "string" : data?.ok !== true) throw new Error("Invalid Word Bank response");
    setFlag(chapterVersionId, tokenIndex, on);
    return data as T;
  });
  queues.set(key, done.catch(() => undefined));
  return done;
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

const flagsUrl = (chapterVersionId: string) => `/api/chapter-versions/${encodeURIComponent(chapterVersionId)}/flags`;

/** Refresh on reading-screen mount; the cookie-authenticated server owns durable Reader scope. */
export function loadFlags(chapterVersionId: string): Promise<void> {
  const request = Symbol();
  loading.set(chapterVersionId, request);
  return (async () => {
    const res = await fetch(flagsUrl(chapterVersionId), { credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`${res.status}`);
    const data: { flags?: FlaggedWord[] } = await res.json();
    if (!Array.isArray(data.flags) || data.flags.some((flag) => !Number.isSafeInteger(flag?.tokenIndex) || flag.tokenIndex < 0 || flag.chapterVersionId !== chapterVersionId)) throw new Error("Invalid saved flags");
    if (loading.get(chapterVersionId) === request) {
      flagged.set(chapterVersionId, new Set(data.flags.map((flag) => flag.tokenIndex)));
      for (const listener of listeners) listener();
    }
  })().finally(() => { if (loading.get(chapterVersionId) === request) loading.delete(chapterVersionId); });
}

/** Meaning retry is independent of flagging, so it never re-flags a word removed by the Reader. */
export async function lookupWordMeaning(chapterVersionId: string, tokenIndex: number, signal?: AbortSignal): Promise<WordMeaning> {
  const res = await fetch(`/api/chapter-versions/${encodeURIComponent(chapterVersionId)}/words/${tokenIndex}/meaning`, {
    credentials: "same-origin", cache: "no-store", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const result: WordMeaning = await res.json();
  if (!result || typeof result.meaning !== "string" || !result.meaning.trim() || !["oci-generative-ai", "chapter", "unavailable"].includes(result.source)) throw new Error("Invalid word meaning");
  return result;
}

/** Flags the word and resolves to its in-context meaning. */
export async function flagWord(chapterVersionId: string, token: Token): Promise<string> {
  const { meaning } = await send<FlagResponse>(chapterVersionId, token.index, true, flagsUrl(chapterVersionId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word: token.normalized, tokenIndex: token.index }),
  });
  return meaning;
}

export async function unflagWord(chapterVersionId: string, token: Token): Promise<void> {
  await send(chapterVersionId, token.index, false, `${flagsUrl(chapterVersionId)}/${token.index}`, {
    method: "DELETE",
  });
}
