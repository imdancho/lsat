import { Suspense } from "react";
import Link from "next/link";
import { NavLinks, NavLinksFallback } from "@/components/NavLinks";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="rounded-md font-serif text-xl font-semibold tracking-tight"
        >
          Prephrase
        </Link>
        {/*
          With Cache Components, usePathname() suspends while Next.js prerenders
          a route whose dynamic params are not known yet (e.g. /practice/[id]).
          The boundary keeps the rest of the layout in the static shell.
        */}
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
      </div>
    </header>
  );
}
