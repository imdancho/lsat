import Link from "next/link";

export default function LandingPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-6xl">
        Stop guessing between A–E. Learn to see the flaw yourself.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
        Prephrase hides the answer choices, makes you explain the argument in
        your own words, and an AI coach grades your reasoning in seconds.
      </p>
      <Link
        href="/practice"
        className="mt-10 inline-block rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition-colors hover:bg-accent-strong"
      >
        Try a question — no sign-up
      </Link>
    </section>
  );
}
