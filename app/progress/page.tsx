import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = {
  title: "Progress",
};

export default function ProgressPage() {
  return (
    <PagePlaceholder
      title="Progress"
      description="Your accuracy by question type, the reasoning mistakes you make most often, and a drill picked for your weakest spot."
    />
  );
}
