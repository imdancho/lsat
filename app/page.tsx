import Link from "next/link";
import { FeedbackMock } from "@/components/landing/FeedbackMock";
import { ProfileMock } from "@/components/landing/ProfileMock";
import { QuestionMock } from "@/components/landing/QuestionMock";
import { BEST_VALUE_PLAN, FREE_PLAN, PAID_PLANS } from "@/lib/plan";
import { listSummaries } from "@/lib/questions";
import { PRO_PLANS, QUESTION_TYPES } from "@/lib/types";

const PRIMARY_BUTTON =
  "inline-block rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition-colors hover:bg-accent-strong";
const TEXT_LINK = "rounded-md font-medium text-accent underline underline-offset-4";
const SECTION = "mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-20";
const SECTION_HEADING = "max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl";

const PROBLEMS = [
  {
    title: "Answer choices train you to guess",
    text: "With five options on the page, you learn to eliminate and pick, not to reason. It feels like progress until the choices get subtle.",
  },
  {
    title: "Explanations come too late",
    text: "You read why B was right after you already chose it. By then you are recognizing an answer, not producing one.",
  },
  {
    title: "You never learn why you keep missing",
    text: "A score tells you that you missed three Flaw questions. It does not tell you that you keep describing the wrong flaw.",
  },
];

const STEPS = [
  {
    title: "Read",
    text: "You get a short argument. No answer choices yet.",
  },
  {
    title: "Explain",
    text: "Type or say the conclusion, then the flaw, the missing assumption, or a fact that would strengthen or weaken the argument.",
  },
  {
    title: "Get graded",
    text: "An AI coach checks each part of your answer against an expert answer key, tells you what was right and what was missing, and tags the reasoning mistake.",
  },
  {
    title: "Confirm on the real format",
    text: "Only then do the five choices appear. Pick one and see why each choice is right or wrong.",
  },
];

const PROFILE_POINTS = [
  "Your reasoning score for each question type",
  "The mistakes you repeat, with a short lesson for each",
  "The answer traps you fall for once the choices appear",
  "A recommended drill for your weakest spot",
];

export default function LandingPage() {
  const questionCount = listSummaries().length;

  return (
    <>
      <section className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-[3.25rem]">
            Stop guessing between A–E. Learn to see the flaw yourself.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            Prephrase hides the answer choices, makes you explain the argument
            in your own words, and an AI coach grades your reasoning in seconds.
          </p>
          <p className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href="/practice" className={PRIMARY_BUTTON}>
              Try a question — no sign-up
            </Link>
            <Link href="#how-it-works" className={TEXT_LINK}>
              See how it works
            </Link>
          </p>
          <p className="mt-6 text-sm text-muted">
            {questionCount} original LSAT-style questions · {QUESTION_TYPES.length}{" "}
            question types · type or speak your answers
          </p>
        </div>
        <QuestionMock />
      </section>

      <section aria-labelledby="problem-heading" className="border-y border-line bg-surface">
        <div className={SECTION}>
          <h2 id="problem-heading" className={SECTION_HEADING}>
            Picking from five choices is not the same as reasoning
          </h2>
          <ul className="mt-10 grid gap-8 md:grid-cols-3">
            {PROBLEMS.map((problem) => (
              <li key={problem.title}>
                <h3 className="text-xl font-semibold">{problem.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{problem.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-4">
        <div className={`${SECTION} grid gap-12 lg:grid-cols-2`}>
          <div>
            <h2 id="how-heading" className={SECTION_HEADING}>
              How it works
            </h2>
            <ol className="mt-8 space-y-7">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="mt-1 leading-relaxed text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <FeedbackMock />
        </div>
      </section>

      <section aria-labelledby="profile-heading" className="border-y border-line bg-surface">
        <div className={`${SECTION} grid items-center gap-12 lg:grid-cols-2`}>
          <div>
            <h2 id="profile-heading" className={SECTION_HEADING}>
              Your reasoning profile
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Every graded answer adds to a picture of how you reason. After
              three answers you can see:
            </p>
            <ul className="mt-5 space-y-3">
              {PROFILE_POINTS.map((point) => (
                <li key={point} className="flex gap-2.5 leading-snug">
                  <span aria-hidden="true" className="font-semibold text-accent">
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-7">
              <Link href="/progress" className={TEXT_LINK}>
                Open your profile
              </Link>
            </p>
          </div>
          <ProfileMock />
        </div>
      </section>

      <section aria-labelledby="pricing-heading">
        <div className={SECTION}>
          <h2 id="pricing-heading" className={SECTION_HEADING}>
            Free to start. Pro when you want every answer graded.
          </h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            <li className="rounded-xl border border-line bg-surface p-5">
              <h3 className="text-xl font-semibold">{FREE_PLAN.name}</h3>
              <p className="mt-1 text-muted">
                <span className="text-2xl font-semibold text-ink">{FREE_PLAN.price}</span>{" "}
                {FREE_PLAN.period}
              </p>
              <p className="mt-3 leading-relaxed">{FREE_PLAN.features[0].text}</p>
            </li>
            {PRO_PLANS.map((plan) => {
              const info = PAID_PLANS[plan];
              return (
                <li key={plan} className="rounded-xl border border-line bg-surface p-5">
                  <h3 className="text-xl font-semibold">
                    {info.name}
                    {plan === BEST_VALUE_PLAN && (
                      <span className="ml-2 rounded-full bg-accent-soft px-2.5 py-0.5 align-middle font-sans text-sm font-medium text-accent">
                        Best value
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-muted">
                    <span className="text-2xl font-semibold text-ink">{info.price}</span>{" "}
                    {info.period}
                  </p>
                  <p className="mt-3 leading-relaxed">{info.features[0].text}</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-8">
            <Link href="/pricing" className={TEXT_LINK}>
              Compare plans
            </Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="start-heading" className="border-t border-line bg-accent-soft">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2
            id="start-heading"
            className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
          >
            Find out what you actually understand
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted">
            One argument, two short answers, feedback in seconds. No account,
            no credit card.
          </p>
          <p className="mt-8">
            <Link href="/practice" className={PRIMARY_BUTTON}>
              Try a question — no sign-up
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
