import Link from "next/link";
import { FREE_GRADES_PER_DAY, PAID_PLANS } from "@/lib/plan";

/**
 * An invitation to go Pro, shown at moments when the student is clearly
 * engaged: after a run of questions, or on finishing a whole question type.
 */
export function ProOffer({ title, compact = false }: { title: string; compact?: boolean }) {
  return (
    <aside
      aria-label="Prephrase Pro"
      className={`rounded-xl border border-accent/30 bg-accent-soft ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <p className={`font-serif font-semibold ${compact ? "text-lg" : "text-xl"}`}>{title}</p>
      <p className="mt-2 max-w-2xl leading-relaxed">
        The free plan grades {FREE_GRADES_PER_DAY} answers a day. Pro grades
        every answer you write, for {PAID_PLANS.pro_monthly.price} a month, or{" "}
        {PAID_PLANS.test_day.price} {PAID_PLANS.test_day.period}.
      </p>
      <p className="mt-4">
        <Link
          href="/pricing"
          className="inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-strong"
        >
          See Pro plans
        </Link>
      </p>
    </aside>
  );
}
