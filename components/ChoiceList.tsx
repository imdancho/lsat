import { TRAP_TAG_INFO } from "@/lib/taxonomy";
import type { ChoiceIndex, FiveOf, QuestionReveal } from "@/lib/types";

const LETTERS = ["A", "B", "C", "D", "E"] as const;
const INDEXES: ChoiceIndex[] = [0, 1, 2, 3, 4];

type ChoiceListProps = {
  choices: FiveOf<string>;
  picked: ChoiceIndex | null;
  /** Answer-side data. Rendered only once a choice has been picked. */
  reveal: QuestionReveal;
  onPick: (index: ChoiceIndex) => void;
};

export function ChoiceList({ choices, picked, reveal, onPick }: ChoiceListProps) {
  if (picked === null) {
    return (
      <ul className="space-y-2">
        {INDEXES.map((i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onPick(i)}
              className="flex w-full gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-left leading-relaxed transition-colors hover:border-accent hover:bg-accent-soft"
            >
              <span className="font-semibold text-muted">{LETTERS[i]}</span>
              <span>{choices[i]}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-2">
      {INDEXES.map((i) => {
        const isCorrect = i === reveal.correctIndex;
        const isPicked = i === picked;
        const tone = isCorrect
          ? "border-green-300 bg-green-50"
          : isPicked
            ? "border-red-300 bg-red-50"
            : "border-line bg-surface";
        return (
          <li key={i} className={`rounded-lg border px-4 py-3 ${tone}`}>
            <p className="flex gap-3 leading-relaxed">
              <span className="font-semibold text-muted">{LETTERS[i]}</span>
              <span>{choices[i]}</span>
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 pl-7 text-sm font-semibold">
              {isCorrect ? (
                <span className="text-green-800">✓ Correct answer</span>
              ) : (
                <span className={isPicked ? "text-red-800" : "text-muted"}>
                  ✗ {TRAP_TAG_INFO[reveal.choiceTraps[i]].label}
                </span>
              )}
              {isPicked && (
                <span className="rounded-full border border-current px-2 py-0.5 text-xs font-medium">
                  Your pick
                </span>
              )}
            </p>
            <p className="mt-1 pl-7 text-sm leading-relaxed text-ink/80">
              {reveal.choiceExplanations[i]}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
