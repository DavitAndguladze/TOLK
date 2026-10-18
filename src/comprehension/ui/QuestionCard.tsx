"use client";

import { AnswerInput } from "./AnswerInput";
import type { QuestionCardProps } from "./types";

export function QuestionCard({ question, value, via, onChange, transcriber }: QuestionCardProps) {
  return (
    <li className="rounded-2xl border border-hairline bg-white/60 p-5">
      <p className="font-ui text-base font-semibold text-ink">{question.prompt}</p>

      {question.choices ? (
        <ul className="mt-3 grid gap-2">
          {question.choices.map((choice) => (
            <li key={choice}>
              <button
                type="button"
                onClick={() => onChange(choice, "typed")}
                aria-pressed={value === choice}
                className={`min-h-11 w-full cursor-pointer rounded-xl border px-4 text-left text-sm transition outline-light focus-visible:outline-2 ${
                  value === choice ? "border-light bg-light/10 font-semibold text-light" : "border-hairline bg-white/60 text-ink hover:bg-white"
                }`}
              >
                {choice}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3">
          <AnswerInput
            via={via}
            onToggleVia={(nextVia) => onChange(value, nextVia)}
            value={value}
            onChange={(nextValue) => onChange(nextValue, via)}
            transcriber={transcriber}
          />
        </div>
      )}
    </li>
  );
}
