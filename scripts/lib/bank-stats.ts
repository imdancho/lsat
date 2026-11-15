import type { Question } from "@/lib/types";

export function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/** True when the stimulus opens with a role or name, e.g. "City planner:". */
export function hasSpeakerLabel(stimulus: string): boolean {
  return /^[A-Z][A-Za-z.]*(?: [A-Za-z.]+){0,2}:/.test(stimulus);
}

/** True for two-speaker exchanges (a second labelled line). */
export function hasTwoSpeakers(stimulus: string): boolean {
  return /\n[A-Z][A-Za-z.]*(?: [A-Za-z.]+){0,2}:/.test(stimulus);
}

/** True when no other choice is longer than the correct one. */
export function isCorrectLongest(q: Question): boolean {
  const lengths = q.choices.map((c) => c.length);
  return lengths[q.correctIndex] === Math.max(...lengths);
}

export function tally<T extends string | number>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return counts;
}
