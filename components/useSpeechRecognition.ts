"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// The Web Speech API is missing from TypeScript's DOM library, so the parts
// used here are declared locally.
type RecognitionResult = {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
};
type RecognitionResultEvent = { readonly results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { readonly error: string };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognitionConstructor = new () => Recognition;

function getRecognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const scope = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

const MAX_LISTEN_MS = 60_000;
const SILENCE_MS = 4_000;

const BLOCKED =
  "Microphone access is blocked. Allow it for this site in your browser settings, then try again.";
const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": BLOCKED,
  "service-not-allowed": BLOCKED,
  "no-speech": "We didn't hear anything. Tap the mic and try again.",
  "audio-capture": "No microphone was found. Check that one is connected.",
  network:
    "Voice recognition could not reach its service. Check your connection, or type your answer.",
};
const UNKNOWN_ERROR = "Voice input stopped unexpectedly. Try again, or type your answer.";

export type SpeechSupport = "unknown" | "supported" | "unsupported";

const subscribeToNothing = () => () => {};

/**
 * Whether this browser can do speech recognition. "unknown" while rendering on
 * the server and during hydration, so nothing voice-related flashes in or out.
 */
export function useSpeechSupport(): SpeechSupport {
  return useSyncExternalStore(
    subscribeToNothing,
    () => (getRecognitionConstructor() ? "supported" : "unsupported"),
    () => "unknown",
  );
}

// Browsers allow one recognition session at a time; starting a second mic
// stops the first.
let stopActiveSession: (() => void) | null = null;

/**
 * Live speech-to-text with the browser's own engine (no key, no upload by us).
 * `onFinalText` receives each phrase once the engine has settled on it;
 * `interim` holds the words still being recognized.
 */
export function useSpeechRecognition(onFinalText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);

  const onFinalTextRef = useRef(onFinalText);
  useEffect(() => {
    onFinalTextRef.current = onFinalText;
  });

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition = getRecognitionConstructor();
    if (!SpeechRecognition) return;
    stopActiveSession?.();

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let silenceTimer: number | undefined;
    const maxTimer = window.setTimeout(() => recognition.stop(), MAX_LISTEN_MS);
    const stopThisSession = () => recognition.stop();
    let committed = 0; // results already handed to onFinalText

    recognition.onresult = (event) => {
      // Every result restarts the silence countdown.
      window.clearTimeout(silenceTimer);
      silenceTimer = window.setTimeout(() => recognition.stop(), SILENCE_MS);

      let pending = "";
      for (let i = committed; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();
        if (result.isFinal && i === committed) {
          committed += 1;
          if (text) onFinalTextRef.current(text);
        } else {
          pending = `${pending} ${text}`;
        }
      }
      setInterim(pending.trim());
    };

    recognition.onerror = (event) => {
      // "aborted" is our own doing (another mic started, or the page was left).
      if (event.error !== "aborted") {
        setError(ERROR_MESSAGES[event.error] ?? UNKNOWN_ERROR);
      }
    };

    recognition.onend = () => {
      window.clearTimeout(silenceTimer);
      window.clearTimeout(maxTimer);
      if (stopActiveSession === stopThisSession) stopActiveSession = null;
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setListening(false);
      setInterim("");
    };

    try {
      recognition.start();
    } catch {
      window.clearTimeout(maxTimer);
      setError(UNKNOWN_ERROR);
      return;
    }
    recognitionRef.current = recognition;
    stopActiveSession = stopThisSession;
    setError(null);
    setListening(true);
  }, []);

  // Stop listening when the component goes away or its page is hidden.
  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { listening, interim, error, start, stop };
}
