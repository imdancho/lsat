type PagePlaceholderProps = {
  title: string;
  description: string;
};

/**
 * Stand-in body for a route that exists in the nav but is not built yet.
 * Delete once every page has its real content (build phases: CLAUDE.md §17).
 */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        {description}
      </p>
      <p className="mt-8 inline-block rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-muted">
        Coming soon
      </p>
    </div>
  );
}
