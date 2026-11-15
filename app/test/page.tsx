import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = {
  title: "Timed test",
};

export default function TimedTestPage() {
  return (
    <PagePlaceholder
      title="Timed LR mini-section (LSAT-style)"
      description="Ten mixed questions against a 14-minute clock, then a score and a review of every question you missed."
    />
  );
}
