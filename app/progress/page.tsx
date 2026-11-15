import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { listSummaries } from "@/lib/questions";

export const metadata: Metadata = {
  title: "Progress",
};

export default function ProgressPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Your reasoning profile
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
        Built from the answers saved in this browser. There is no account, so
        your progress stays on this device.
      </p>
      <div className="mt-8">
        <ProgressDashboard questions={listSummaries()} />
      </div>
    </div>
  );
}
