import type { ReactNode } from "react";

type AnswerFieldProps = {
  /** Unique in the document; other pages may stay mounted in the background, so derive it from useId(). */
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  /** Locks the text once it has been sent for grading. */
  readOnly: boolean;
  /** Extra control shown under the textarea, next to the character count. */
  action?: ReactNode;
};

/** A labelled free-response textarea with a character count. */
export function AnswerField({
  id,
  name,
  label,
  value,
  onChange,
  maxLength,
  readOnly,
  action,
}: AnswerFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        readOnly={readOnly}
        rows={3}
        className="mt-2 block w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 leading-relaxed placeholder:text-muted read-only:bg-paper read-only:text-ink/80"
      />
      <div className="mt-1 flex items-center justify-between gap-3 text-sm text-muted">
        <div>{action}</div>
        <p aria-hidden="true">
          {value.length} / {maxLength}
        </p>
      </div>
    </div>
  );
}
