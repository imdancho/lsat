// What each plan costs and includes. The pricing page, the landing page teaser
// and the paywall messages all read from here, so the numbers cannot drift apart.
import type { Membership, ProPlan, Usage } from "@/lib/types";

/** AI-graded answers a day on the free plan. */
export const FREE_GRADES_PER_DAY = 10;

/** How many AI-graded answers were used on the given local day (YYYY-MM-DD). */
export function gradedOn(usage: Usage | null, day: string): number {
  return usage?.day === day ? usage.count : 0;
}

/** What the student may do right now. */
export type Access =
  | { kind: "pro"; membership: Membership }
  /** Opened with ?demo=1: the daily limit is off for this tab. */
  | { kind: "demo" }
  | { kind: "free"; used: number; remaining: number };

/** Works out the access level from what is stored in the browser. */
export function resolveAccess(
  stored: { membership: Membership | null; usage: Usage | null },
  demoMode: boolean,
  today: string,
): Access {
  if (stored.membership) return { kind: "pro", membership: stored.membership };
  if (demoMode) return { kind: "demo" };
  const used = gradedOn(stored.usage, today);
  return { kind: "free", used, remaining: Math.max(0, FREE_GRADES_PER_DAY - used) };
}

export type PlanFeature = {
  text: string;
  /** Promised by the plan but not in the product yet. */
  comingSoon?: true;
};

export type PaidPlanInfo = {
  name: string;
  price: string;
  period: string;
  /** Label of the checkout button. */
  cta: string;
  summary: string;
  features: PlanFeature[];
};

export const FREE_PLAN = {
  name: "Free",
  price: "$0",
  period: "no sign-up",
  summary: "Enough to feel the difference in one sitting.",
  features: [
    { text: `${FREE_GRADES_PER_DAY} AI-graded answers per day` },
    { text: "Full question bank in multiple-choice mode" },
    { text: "Progress page with your reasoning profile" },
  ] satisfies PlanFeature[],
};

export const PAID_PLANS: Record<ProPlan, PaidPlanInfo> = {
  pro_monthly: {
    name: "Pro",
    price: "$29",
    period: "per month",
    cta: "Start Pro — $29/mo",
    summary: "For steady prep, as many questions a day as you want.",
    features: [
      { text: "Unlimited AI grading" },
      {
        text: "Unlimited generated questions targeting your weak spots",
        comingSoon: true,
      },
      { text: "Timed sections", comingSoon: true },
      { text: "Full lesson library" },
    ],
  },
  test_day: {
    name: "Until Test Day",
    price: "$99",
    period: "for 4 months",
    cta: "Get Until Test Day — $99",
    summary: "One payment that covers a typical prep cycle.",
    features: [
      { text: "Everything in Pro for 4 months" },
      { text: "One payment, no renewal" },
      { text: "$17 less than four months of Pro" },
    ],
  },
};

/** The plan to highlight as best value. */
export const BEST_VALUE_PLAN: ProPlan = "test_day";
