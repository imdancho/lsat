"use client";

import { useEffect } from "react";
import { useSpeechRecognition } from "@/components/useSpeechRecognition";

function MicIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

type VoiceInputProps = {
  /** Called with each phrase once the browser has settled on its wording. */
  onText: (text: string) => void;
  /** What the idle button says, e.g. "Speak your answer". */
  label: string;
  disabled?: boolean;
};

/**
 * Mic button for dictating into an answer field. Render it only where speech
 * recognition is supported (see useSpeechSupport). Being a button, it toggles
 * with Space or Enter when focused.
 */
export function VoiceInput({ onText, label, disabled = false }: VoiceInputProps) {
  const { listening, interim, error, start, stop } = useSpeechRecognition(
    (text) => {
      if (!disabled) onText(text);
    },
  );

  // Once the field is locked (the answer was sent for grading), stop listening
  // so nothing more is added to what the grader saw.
  useEffect(() => {
    if (disabled && listening) stop();
  }, [disabled, listening, stop]);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled}
        aria-pressed={listening}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          listening
            ? "border-red-300 bg-red-50 text-red-900"
            : "border-line bg-surface text-ink hover:border-accent"
        }`}
      >
        {listening ? (
          <>
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-red-600 motion-safe:animate-pulse"
            />
            Listening… tap to stop
          </>
        ) : (
          <>
            <MicIcon />
            {label}
          </>
        )}
      </button>
      {listening && interim && (
        <span aria-hidden="true" className="italic text-muted">
          {interim}
        </span>
      )}
      {error && (
        <span role="alert" className="text-red-800">
          {error}
        </span>
      )}
    </div>
  );
}
