import type { RecognizedWord } from "./alignment";

/** A full current hypothesis, including earlier finalized utterances in this session. */
export interface RecognitionSnapshot { words: RecognizedWord[]; final: boolean }
export type OpenRecognition = (
  signal: AbortSignal,
  onSnapshot: (snapshot: RecognitionSnapshot) => void,
  onError: (message: string) => void,
) => Promise<void>;
