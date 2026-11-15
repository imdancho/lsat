import { SAMPLE_ANSWERS, SAMPLE_ARGUMENT } from "@/components/landing/sample";
import { Stimulus } from "@/components/Stimulus";
import { TypeBadge } from "@/components/TypeBadge";

function MockAnswer({ step, label, text }: { step: number; label: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-semibold">
        <span className="mr-2 uppercase tracking-wide text-accent">Step {step}</span>
        {label}
      </p>
      <p className="mt-1.5 rounded-lg border border-line bg-paper px-3 py-2 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

/**
 * A still picture of a practice question in progress: the argument, a
 * student's answers, and the answer choices still hidden. Not interactive; the
 * caption carries its meaning for screen readers.
 */
export function QuestionMock() {
  return (
    <figure>
      <div
        inert
        aria-hidden="true"
        className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <TypeBadge type="flaw" />
          <span className="text-sm text-muted">Example question</span>
        </div>
        <div className="mt-4">
          <Stimulus text={SAMPLE_ARGUMENT} compact />
        </div>
        <div className="mt-5 space-y-4">
          <MockAnswer
            step={1}
            label="Find the conclusion"
            text={SAMPLE_ANSWERS.conclusion}
          />
          <MockAnswer
            step={2}
            label="What's wrong with this reasoning?"
            text={SAMPLE_ANSWERS.main}
          />
        </div>
        <div className="mt-5 space-y-2">
          {["A", "B", "C", "D", "E"].map((letter) => (
            <div key={letter} className="flex items-center gap-3">
              <span className="w-4 text-sm font-semibold text-muted">{letter}</span>
              <span className="h-3 flex-1 rounded-full bg-line" />
            </div>
          ))}
          <p className="pt-1 text-sm text-muted">
            Answer choices stay hidden until your reasoning is graded.
          </p>
        </div>
      </div>
      <figcaption className="sr-only">
        Example of a practice question: an argument about expanding a bike-share
        program, a student&rsquo;s one-sentence statement of its conclusion, the
        student&rsquo;s description of its flaw, and five answer choices that
        stay hidden until the reasoning has been graded.
      </figcaption>
    </figure>
  );
}
