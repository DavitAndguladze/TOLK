"use client";

import { useState } from "react";
import type { AnswerInputProps } from "./types";

const toggle = "min-h-9 cursor-pointer rounded-full px-3 text-sm font-semibold transition outline-light focus-visible:outline-2";
const toggleOn = "bg-light text-white";
const toggleOff = "border border-hairline bg-white/60 text-fog";

export function AnswerInput({ via, onToggleVia, value, onChange, transcriber }: AnswerInputProps) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function record() {
    if (!transcriber) return;
    setRecording(true);
    setError(null);
    try {
      onChange(await transcriber.transcribe());
    } catch {
      setError("Couldn't hear that - try typing instead.");
    } finally {
      setRecording(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <button type="button" onClick={() => onToggleVia("typed")} aria-pressed={via === "typed"} className={`${toggle} ${via === "typed" ? toggleOn : toggleOff}`}>
          Type
        </button>
        <button
          type="button"
          onClick={() => onToggleVia("spoken")}
          aria-pressed={via === "spoken"}
          disabled={!transcriber}
          className={`${toggle} ${via === "spoken" ? toggleOn : toggleOff} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Speak
        </button>
      </div>

      {via === "typed" ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
          className="mt-2 min-h-11 w-full rounded-xl border border-hairline bg-white px-3 text-base text-ink outline-light focus-visible:outline-2"
        />
      ) : (
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={record}
            disabled={recording}
            className="min-h-11 cursor-pointer rounded-xl bg-light px-4 text-sm font-semibold text-white transition outline-light focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {recording ? "Listening..." : value ? "Record again" : "Record answer"}
          </button>
          {value && <p className="text-sm text-fog italic">&ldquo;{value}&rdquo;</p>}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-gold">{error}</p>}
    </div>
  );
}
