import { MistakeTagChip } from "@/components/MistakeTagChip";
import type {
  GradeComponent,
  GradeResult,
  QuestionType,
  Verdict,
} from "@/lib/types";

// Color is never the only signal: each verdict also has an icon and a word.
const VERDICT: Record<Verdict, { icon: string; label: string; className: string }> = {
  correct: {
    icon: "✓",
    label: "Correct",
    className: "border-green-200 bg-green-50 text-green-900",
  },
  partial: {
    icon: "~",
    label: "Partly right",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  incorrect: {
    icon: "✗",
    label: "Not yet",
    className: "border-red-200 bg-red-50 text-red-900",
  },
};

const MAIN_COMPONENT_NAME: Record<QuestionType, string> = {
  main_conclusion: "How the argument supports it",
  flaw: "The flaw",
  necessary_assumption: "The required assumption",
  strengthen: "Your strengthener",
  weaken: "Your weakener",
};

function ComponentVerdict({
  component,
  type,
}: {
  component: GradeComponent;
  type: QuestionType;
}) {
  const verdict = VERDICT[component.verdict];
  const name =
    component.name === "conclusion" ? "The conclusion" : MAIN_COMPONENT_NAME[type];
  return (
    <li className={`rounded-lg border p-4 ${verdict.className}`}>
      <p className="flex items-baseline gap-2 font-semibold">
        <span aria-hidden="true" className="text-lg leading-none">
          {verdict.icon}
        </span>
        <span>
          {name}: {verdict.label}
        </span>
      </p>
      <p className="mt-1.5 leading-relaxed">{component.feedback}</p>
    </li>
  );
}

export function FeedbackCard({
  result,
  type,
}: {
  result: GradeResult;
  type: QuestionType;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-xl font-semibold">Your reasoning</h2>
        <p className="text-muted">
          <span className="font-serif text-3xl font-semibold text-ink">
            {result.overallScore}
          </span>{" "}
          / 100
        </p>
      </div>

      <ul className="mt-4 space-y-3">
        {result.components.map((component) => (
          <ComponentVerdict key={component.name} component={component} type={type} />
        ))}
      </ul>

      {result.mistakeTags.length > 0 && (
        <div className="mt-5">
          <h3 className="font-sans text-sm font-semibold text-muted">
            Mistakes to watch
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {result.mistakeTags.map((tag) => (
              <li key={tag}>
                <MistakeTagChip tag={tag} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-5 leading-relaxed">
        <span className="font-semibold">Next time: </span>
        {result.tip}
      </p>

      <details className="mt-4 rounded-lg border border-line bg-paper px-4 py-3">
        <summary className="cursor-pointer font-medium">Expert answer</summary>
        <p className="mt-2 leading-relaxed">{result.modelAnswer}</p>
      </details>
    </div>
  );
}

/** Placeholder with the card's rough shape, shown while the grade is loading. */
export function FeedbackCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-xl border border-line bg-surface p-5 sm:p-6"
    >
      <div className="h-7 w-40 rounded bg-line" />
      <div className="mt-4 h-20 rounded-lg bg-line/60" />
      <div className="mt-3 h-20 rounded-lg bg-line/60" />
      <div className="mt-5 h-5 w-3/4 rounded bg-line" />
    </div>
  );
}
