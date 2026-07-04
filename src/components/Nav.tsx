"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import {
  ChartIcon,
  SlidersIcon,
  SparklesIcon,
  TrophyIcon,
  UsersIcon,
} from "./dashboard/icons";

const LINKS = [
  { href: "/", label: "Home", Icon: UsersIcon },
  { href: "/rankings", label: "Rankings", Icon: ChartIcon },
  { href: "/bracket", label: "Bracket", Icon: TrophyIcon },
  { href: "/history", label: "History", Icon: SparklesIcon },
  { href: "/methodology", label: "Methodology", Icon: SlidersIcon },
];

export default function Nav() {
  const pathname = usePathname();
  const activeIndex = LINKS.findIndex((link) =>
    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href),
  );

  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const hasMounted = useRef(false);

  useLayoutEffect(() => {
    const el = itemRefs.current[activeIndex];
    const indicator = indicatorRef.current;
    if (!el || !indicator) return;

    const { offsetLeft, offsetWidth } = el;
    if (!hasMounted.current) {
      gsap.set(indicator, { x: offsetLeft, width: offsetWidth });
      hasMounted.current = true;
      return;
    }
    gsap.to(indicator, {
      x: offsetLeft,
      width: offsetWidth,
      duration: 0.45,
      ease: "power3.out",
    });
  }, [activeIndex]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 py-4"
      style={{ viewTransitionName: "site-header" }}
    >

      <nav className="glass pointer-events-auto relative flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1.5">
        <span
          ref={indicatorRef}
          className="pointer-events-none absolute inset-y-1.5 left-0 rounded-full bg-white/15"
        />
        {LINKS.map((link, i) => {
          const active = i === activeIndex;
          const Icon = link.Icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              transitionTypes={link.href === "/" ? undefined : ["nav-forward"]}
              title={link.label}
              className={`relative z-10 flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm ${
                active
                  ? "font-medium text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {active && (
                <span className="whitespace-nowrap">{link.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
