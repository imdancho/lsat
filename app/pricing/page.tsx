import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <PagePlaceholder
      title="Pricing"
      description="Start free with 10 AI-graded answers a day. Pro removes the limit."
    />
  );
}
