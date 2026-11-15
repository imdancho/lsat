import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutPending, CheckoutSuccess } from "@/components/CheckoutSuccess";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <Suspense fallback={<CheckoutPending />}>
        <CheckoutSuccess />
      </Suspense>
    </div>
  );
}
