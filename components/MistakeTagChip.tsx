import { MISTAKE_TAG_INFO } from "@/lib/taxonomy";
import type { StudentMistakeTag } from "@/lib/types";

/**
 * A mistake tag with its explanation in a tooltip. The chip is a button so the
 * tooltip also opens on keyboard focus and on tap.
 */
export function MistakeTagChip({ tag }: { tag: StudentMistakeTag }) {
  const { label, description } = MISTAKE_TAG_INFO[tag];
  const tooltipId = `mistake-${tag}`;
  return (
    <span className="group relative inline-block">
      <button
        type="button"
        aria-describedby={tooltipId}
        className="cursor-help rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-900"
      >
        {label}
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-10 mt-2 w-64 max-w-[80vw] rounded-lg bg-ink px-3 py-2 text-sm leading-snug text-white opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {description}
      </span>
    </span>
  );
}
