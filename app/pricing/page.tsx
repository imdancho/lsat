import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { CanceledToast } from "@/components/PricingNotices";
import { ProNotice } from "@/components/ProStatus";
import {
  BEST_VALUE_PLAN,
  FREE_PLAN,
  PAID_PLANS,
  type PlanFeature,
} from "@/lib/plan";
import { PRO_PLANS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free with 10 AI-graded answers a day. Prephrase Pro removes the limit for $29 a month, or $99 for four months.",
};

function FeatureList({ features }: { features: PlanFeature[] }) {
  return (
    <ul className="space-y-2.5">
      {features.map((feature) => (
        <li key={feature.text} className="flex gap-2.5 leading-snug">
          <span aria-hidden="true" className="font-semibold text-accent">
            ✓
          </span>
          <span>
            {feature.text}
            {feature.comingSoon && (
              <span className="ml-2 whitespace-nowrap rounded-full border border-line px-2 py-0.5 text-xs font-medium text-muted">
                coming soon
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Price({ price, period }: { price: string; period: string }) {
  return (
    <p className="mt-4 flex items-baseline gap-2">
      <span className="text-4xl font-semibold tracking-tight">{price}</span>
      <span className="text-muted">{period}</span>
    </p>
  );
}

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pricing</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
        Start free, with no sign-up. Upgrade when you want every answer graded.
      </p>

      <div className="mt-8">
        <ProNotice />
      </div>

      <ul className="mt-8 grid gap-5 lg:grid-cols-3">
        <li className="flex flex-col rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-2xl font-semibold">{FREE_PLAN.name}</h2>
          <Price price={FREE_PLAN.price} period={FREE_PLAN.period} />
          <p className="mt-3 text-muted">{FREE_PLAN.summary}</p>
          <div className="mt-6 flex-1">
            <FeatureList features={FREE_PLAN.features} />
          </div>
          <Link
            href="/practice"
            className="mt-8 block rounded-lg border border-line bg-surface px-5 py-3 text-center font-medium transition-colors hover:border-accent"
          >
            Start practicing
          </Link>
        </li>

        {PRO_PLANS.map((plan) => {
          const info = PAID_PLANS[plan];
          const bestValue = plan === BEST_VALUE_PLAN;
          return (
            <li
              key={plan}
              className={`relative flex flex-col rounded-2xl bg-surface p-6 ${
                bestValue ? "border-2 border-accent" : "border border-line"
              }`}
            >
              {bestValue && (
                <p className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-sm font-semibold text-white">
                  Best value
                </p>
              )}
              <h2 className="text-2xl font-semibold">{info.name}</h2>
              <Price price={info.price} period={info.period} />
              <p className="mt-3 text-muted">{info.summary}</p>
              <div className="mt-6 flex-1">
                <FeatureList features={info.features} />
              </div>
              <div className="mt-8">
                <CheckoutButton plan={plan} emphasized={bestValue} />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 max-w-3xl leading-relaxed">
        7Sage $69/mo, LSAT Demon $99/mo — Prephrase Pro $29/mo, and it works
        alongside them.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
        Other products&rsquo; prices are approximate and may change. While
        Prephrase is in preview, the lesson library and the timed section are
        open on every plan, and Pro is remembered on this device only: there
        are no accounts.
      </p>

      <Suspense fallback={null}>
        <CanceledToast />
      </Suspense>
    </div>
  );
}
