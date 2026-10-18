"use client";

import { useEffect, useRef, useState } from "react";
import type { AnswerInputProps } from "./types";

const toggleStyle = "min-h-9 cursor-pointer rounded-full px-3 text-sm font-semibold transition outline-light focus-visible:outline-2";
const toggleOn = "bg-light text-white";
const toggleOff = "border border-hairline bg-white/60 text-fog";

export function AnswerInput({ via, onToggleVia, value, onChange, transcriber }: AnswerInputProps) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const capture = useRef<AbortController | null>(null);
  useEffect(() => () => capture.current?.abort(), [via]);

  function toggle(next: "spoken" | "typed") {
    capture.current?.abort();
    capture.current = null;
    setRecording(false);
    setError(null);
    onToggleVia(next);
  }

  async function record() {
    if (!transcriber || capture.current) return;
    const controller = new AbortController();
    capture.current = controller;
    setRecording(true);
    setError(null);
    try {
      const text = await transcriber.transcribe(undefined, controller.signal);
      if (!controller.signal.aborted) onChange(text);
    } catch {
      if (!controller.signal.aborted) setError("Couldn't hear that - try typing instead.");
    } finally {
      if (capture.current === controller) {
        capture.current = null;
        setRecording(false);
      }
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <button type="button" onClick={() => toggle("typed")} aria-pressed={via === "typed"} className={`${toggleStyle} ${via === "typed" ? toggleOn : toggleOff}`}>
          Type
        </button>
        <button
          type="button"
          onClick={() => toggle("spoken")}
          aria-pressed={via === "spoken"}
          disabled={!transcriber}
          className={`${toggleStyle} ${via === "spoken" ? toggleOn : toggleOff} disabled:cursor-not-allowed disabled:opacity-50`}
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
