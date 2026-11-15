import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = {
  title: "Practice",
};

export default function PracticePage() {
  return (
    <PagePlaceholder
      title="Practice"
      description="Pick a question type, read the argument, and explain it in your own words before you see the answer choices."
    />
  );
}
