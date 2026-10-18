import type { ListeningEvent, Token, WordOutcome } from "../types";
import type { Chunk } from "./chunk";

export type SessionStatus = "ready" | "listening" | "paused" | "chapter-done";

export interface ReadingState {
  chunkCount: number;
  chunkIndex: number;
  status: SessionStatus;
  /** Keyed by Chapter Version token index. A token with no entry is still pending. */
  outcomes: Record<number, Exclude<WordOutcome, "pending">>;
  /** The token the Reader hesitated on, until it is read. */
  stuckOn: number | null;
  lastRead: number | null;
  /** Listening stopped on an error rather than a Pause tap. */
  interrupted: boolean;
  listeningError: string | null;
  /** Reader opted to skip reading aloud for this Chapter (ticket #18). */
  silent: boolean;
}

export type ReadingAction =
  | { type: "read-aloud" }
  | { type: "pause" }
  | { type: "go-to-chunk"; index: number }
  | { type: "restore-position"; index: number }
  | { type: "finish-chapter" }
  | { type: "toggle-silent" }
  | { type: "listening"; event: ListeningEvent };

export const initialReadingState = (chunkCount: number): ReadingState => ({
  chunkCount,
  chunkIndex: 0,
  status: "ready",
  outcomes: {},
  stuckOn: null,
  lastRead: null,
  interrupted: false,
  listeningError: null,
  silent: false,
});

export function readingReducer(state: ReadingState, action: ReadingAction): ReadingState {
  switch (action.type) {
    case "read-aloud":
      return { ...state, status: "listening", interrupted: false, listeningError: null };
    case "pause":
      return { ...state, status: "paused", stuckOn: null };
    case "go-to-chunk":
      if (state.status === "listening" || state.status === "chapter-done") return state;
      if (!Number.isInteger(action.index) || action.index < 0 || action.index >= state.chunkCount) return state;
      return { ...state, chunkIndex: action.index, status: "ready", stuckOn: null, interrupted: false, listeningError: null };
    case "restore-position":
      if (state.status !== "ready" || Object.keys(state.outcomes).length) return state;
      if (!Number.isInteger(action.index) || action.index < 0 || action.index >= state.chunkCount) return state;
      return { ...state, chunkIndex: action.index };
    case "finish-chapter":
      return { ...state, status: "chapter-done", stuckOn: null };
    case "toggle-silent":
      return { ...state, silent: !state.silent };
    case "listening":
      return state.status === "listening" ? onListeningEvent(state, action.event) : state;
  }
}

function onListeningEvent(state: ReadingState, event: ListeningEvent): ReadingState {
  switch (event.type) {
    case "word": {
      const { tokenIndex, outcome } = event.result;
      if (outcome === "pending") {
        const outcomes = { ...state.outcomes };
        delete outcomes[tokenIndex];
        const remaining = Object.keys(outcomes).map(Number);
        return { ...state, outcomes, lastRead: state.lastRead === tokenIndex ? (remaining.length ? Math.max(...remaining) : null) : state.lastRead };
      }
      return {
        ...state,
        outcomes: { ...state.outcomes, [tokenIndex]: outcome },
        stuckOn: state.stuckOn === tokenIndex ? null : state.stuckOn,
        lastRead: tokenIndex,
      };
    }
    case "hesitation":
      return { ...state, stuckOn: event.tokenIndex };
    case "chunk-complete":
      return state.chunkIndex === state.chunkCount - 1
        ? { ...state, status: "chapter-done", stuckOn: null }
        : { ...state, chunkIndex: state.chunkIndex + 1 };
    case "error":
      return { ...state, status: "paused", stuckOn: null, interrupted: true, listeningError: event.message };
  }
}

/** What a resumed listening session should read: the chunk's words with no outcome yet. */
export const unreadTokens = (chunk: Chunk, state: Pick<ReadingState, "outcomes">): Token[] =>
  chunk.tokens.filter((t) => state.outcomes[t.index] === undefined);
