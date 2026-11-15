const SPEAKER_LABEL = /^([A-Z][A-Za-z.]*(?: [A-Za-z.]+){0,2}:)\s+(.*)$/;

/**
 * The argument itself, set for comfortable reading. One paragraph per speaker.
 * `compact` is for previews, where the argument sits inside a small card.
 */
export function Stimulus({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "space-y-3 leading-relaxed"
          : "max-w-[68ch] space-y-3 text-[1.0625rem] leading-[1.7] sm:text-lg sm:leading-[1.7]"
      }
    >
      {text.split("\n").map((paragraph, i) => {
        const labelled = SPEAKER_LABEL.exec(paragraph);
        return (
          <p key={i}>
            {labelled ? (
              <>
                <span className="font-semibold">{labelled[1]}</span> {labelled[2]}
              </>
            ) : (
              paragraph
            )}
          </p>
        );
      })}
    </div>
  );
}
