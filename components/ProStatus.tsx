"use client";

import Link from "next/link";
import { useMembership } from "@/components/useAttempts";
import { PAID_PLANS } from "@/lib/plan";
import { clearMembership } from "@/lib/progress";

/** The "PRO" badge beside the logo, shown once Pro is on in this browser. */
export function ProBadge() {
  const membership = useMembership();
  if (!membership) return null;
  return (
    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold tracking-wide text-white">
      <span className="sr-only">Your plan: </span>PRO
    </span>
  );
}

/** A line at the top of the pricing page for a visitor who already has Pro. */
export function ProNotice() {
  const membership = useMembership();
  if (!membership) return null;
  return (
    <p className="rounded-xl border border-accent/40 bg-surface p-4">
      <span aria-hidden="true" className="font-semibold text-accent">
        ✓{" "}
      </span>
      <span className="font-semibold">
        {PAID_PLANS[membership.plan].name} is active on this device.
      </span>{" "}
      AI grading is unlimited.{" "}
      <Link
        href="/practice"
        className="font-medium text-accent underline underline-offset-4"
      >
        Go practice
      </Link>
    </p>
  );
}

const sinceFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

/**
 * For repeat demos: shows the Pro flag saved in this browser and lets the
 * visitor clear it, which brings the free plan and its daily limit back.
 */
export function ManagePro() {
  const membership = useMembership();
  if (!membership) return null;
  return (
    <details className="rounded-xl border border-line bg-surface px-5 py-4">
      <summary className="cursor-pointer font-medium">Manage / reset demo Pro</summary>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted">
        {PAID_PLANS[membership.plan].name} has been active on this device since{" "}
        {sinceFormat.format(new Date(membership.since))}. Resetting brings back the free
        plan and its daily limit.
      </p>
      <button
        type="button"
        onClick={clearMembership}
        className="mt-4 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
      >
        Reset demo Pro
      </button>
    </details>
  );
}
