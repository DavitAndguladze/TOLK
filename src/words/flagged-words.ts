"use client";

import { useSyncExternalStore } from "react";
import type { Api, FlaggedWord, Token } from "../types";
import type { WordMeaning } from "./meaning";

type FlagResponse = Api["POST /api/chapter-versions/[versionId]/flags"]["res"];

const EMPTY: ReadonlySet<number> = new Set();

/** One reading mount owns its cache and requests; the server cookie still supplies authentication. */
export function createFlagScope() {
  return {
    flagged: new Map<string, ReadonlySet<number>>(),
    listeners: new Set<() => void>(),
    queues: new Map<string, Promise<unknown>>(),
    request: new AbortController(),
  };
}
export type FlagScope = ReturnType<typeof createFlagScope>;

export function disposeFlags(scope: FlagScope) {
  scope.request.abort();
  scope.queues.clear();
  scope.flagged.clear();
  for (const listener of scope.listeners) listener();
}

const keyOf = (chapterVersionId: string, tokenIndex: number) => `${chapterVersionId}:${tokenIndex}`;

function setFlag(chapterVersionId: string, tokenIndex: number, on: boolean, scope: FlagScope) {
  const next = new Set(scope.flagged.get(chapterVersionId));
  if (on) next.add(tokenIndex);
  else next.delete(tokenIndex);
  scope.flagged.set(chapterVersionId, next);
  for (const listener of scope.listeners) listener();
}

function send<T>(chapterVersionId: string, tokenIndex: number, on: boolean, url: string, init: RequestInit, scope: FlagScope): Promise<T> {
  const key = keyOf(chapterVersionId, tokenIndex);
  const lifetime = scope.request.signal;
  // Capture the lifetime before queueing: an old action must never start with a new Reader's cookie.
  const done = (scope.queues.get(key) ?? Promise.resolve()).then(async () => {
    lifetime.throwIfAborted();
    const res = await fetch(url, { ...init, credentials: "same-origin", signal: AbortSignal.any([lifetime, AbortSignal.timeout(10000)]) });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    lifetime.throwIfAborted();
    if (on ? data?.flagged?.tokenIndex !== tokenIndex || data?.flagged?.chapterVersionId !== chapterVersionId || typeof data?.meaning !== "string" : data?.ok !== true) throw new Error("Invalid Word Bank response");
    setFlag(chapterVersionId, tokenIndex, on, scope);
    return data as T;
  });
  scope.queues.set(key, done.catch(() => undefined));
  return done;
}

function subscribe(scope: FlagScope, listener: () => void) {
  scope.listeners.add(listener);
  return () => scope.listeners.delete(listener);
}

/** Token indexes the Reader has flagged in this Chapter Version, kept in sync with every open WordSheet. */
export function useFlaggedWords(chapterVersionId: string, scope: FlagScope): ReadonlySet<number> {
  return useSyncExternalStore((listener) => subscribe(scope, listener), () => scope.flagged.get(chapterVersionId) ?? EMPTY, () => EMPTY);
}

export function isFlagged(chapterVersionId: string, tokenIndex: number, scope: FlagScope): boolean {
  return scope.flagged.get(chapterVersionId)?.has(tokenIndex) ?? false;
}

const flagsUrl = (chapterVersionId: string) => `/api/chapter-versions/${encodeURIComponent(chapterVersionId)}/flags`;

/** Refresh on reading-screen mount; the cookie-authenticated server owns durable Reader scope. */
export function loadFlags(chapterVersionId: string, scope: FlagScope): Promise<void> {
  disposeFlags(scope);
  scope.request = new AbortController();
  const lifetime = scope.request.signal;
  return (async () => {
    const res = await fetch(flagsUrl(chapterVersionId), { credentials: "same-origin", cache: "no-store", signal: AbortSignal.any([lifetime, AbortSignal.timeout(10000)]) });
    if (!res.ok) throw new Error(`${res.status}`);
    const data: { flags?: FlaggedWord[] } = await res.json();
    if (!Array.isArray(data.flags) || data.flags.some((flag) => !Number.isSafeInteger(flag?.tokenIndex) || flag.tokenIndex < 0 || flag.chapterVersionId !== chapterVersionId)) throw new Error("Invalid saved flags");
    if (!lifetime.aborted) {
      scope.flagged.set(chapterVersionId, new Set(data.flags.map((flag) => flag.tokenIndex)));
      for (const listener of scope.listeners) listener();
    }
  })();
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
export async function flagWord(chapterVersionId: string, token: Token, scope: FlagScope): Promise<string> {
  const { meaning } = await send<FlagResponse>(chapterVersionId, token.index, true, flagsUrl(chapterVersionId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word: token.normalized, tokenIndex: token.index }),
  }, scope);
  return meaning;
}

export async function unflagWord(chapterVersionId: string, token: Token, scope: FlagScope): Promise<void> {
  await send(chapterVersionId, token.index, false, `${flagsUrl(chapterVersionId)}/${token.index}`, {
    method: "DELETE",
  }, scope);
}
