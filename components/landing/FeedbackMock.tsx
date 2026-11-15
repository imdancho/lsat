import { FeedbackCard } from "@/components/FeedbackCard";
import { SAMPLE_FEEDBACK } from "@/components/landing/sample";

/**
 * The real feedback card, filled with the landing page's worked example and
 * frozen: a picture of the product, not a live grade.
 */
export function FeedbackMock() {
  return (
    <figure>
      <div inert aria-hidden="true" className="shadow-sm">
        <FeedbackCard result={SAMPLE_FEEDBACK} type="flaw" />
      </div>
      <figcaption className="mt-3 text-sm leading-relaxed text-muted">
        Example feedback on the question above. The student found the
        conclusion but described the flaw too vaguely, so the score is 75 out
        of 100 and the answer is tagged &ldquo;Too vague.&rdquo;
      </figcaption>
    </figure>
  );
}
