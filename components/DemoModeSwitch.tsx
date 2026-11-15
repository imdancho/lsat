"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { setDemoMode } from "@/lib/progress";

/**
 * Remembers ?demo=1 for the rest of the tab's life, so the daily limit stays
 * off while the visitor moves between pages; ?demo=0 turns it back on.
 * Renders nothing. Needs a <Suspense> boundary because it reads the query string.
 */
export function DemoModeSwitch() {
  const demo = useSearchParams().get("demo");
  useEffect(() => {
    if (demo === "1") setDemoMode(true);
    else if (demo === "0") setDemoMode(false);
  }, [demo]);
  return null;
}
