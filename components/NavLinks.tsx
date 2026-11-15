"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/practice", label: "Practice" },
  { href: "/progress", label: "Progress" },
  { href: "/test", label: "Timed test" },
  { href: "/pricing", label: "Pricing" },
] as const;

function isCurrentSection(pathname: string | null, href: string): boolean {
  return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
}

function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main">
      <ul className="-mx-2 flex flex-wrap items-center gap-x-1 sm:gap-x-2">
        {NAV_ITEMS.map(({ href, label }) => {
          const current = isCurrentSection(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`block rounded-md px-2 py-2 text-sm font-medium underline-offset-8 transition-colors ${
                  current
                    ? "text-ink underline decoration-accent decoration-2"
                    : "text-muted hover:text-ink"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Top-nav links with the current section highlighted. */
export function NavLinks() {
  return <NavList pathname={usePathname()} />;
}

/** The same links with nothing highlighted, so the header keeps its size. */
export function NavLinksFallback() {
  return <NavList pathname={null} />;
}
