"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Toast } from "@/components/Toast";

/**
 * The toast shown when Stripe sends the visitor back to /pricing?canceled=1.
 * Dismissing it also drops the marker from the address, so a reload does not
 * bring it back. Needs a <Suspense> boundary because it reads the query string.
 */
export function CanceledToast() {
  const router = useRouter();
  const canceled = useSearchParams().get("canceled") === "1";
  if (!canceled) return null;
  return (
    <Toast
      tone="info"
      autoDismissMs={8000}
      onDismiss={() => router.replace("/pricing", { scroll: false })}
    >
      Checkout canceled — no charge made.
    </Toast>
  );
}
