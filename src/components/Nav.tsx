"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  CalendarIcon,
  ChartIcon,
  CloseIcon,
  HomeIcon,
  MapPinIcon,
  MenuIcon,
  RefreshIcon,
  ShirtIcon,
  SlidersIcon,
  TrophyIcon,
} from "./dashboard/icons";

const LINKS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/matches", label: "Matches", Icon: CalendarIcon },
  { href: "/rankings", label: "Rankings", Icon: ChartIcon },
  { href: "/bracket", label: "Bracket", Icon: TrophyIcon },
  { href: "/history", label: "History", Icon: RefreshIcon },
  { href: "/players", label: "Players", Icon: ShirtIcon },
  { href: "/venues", label: "Venues", Icon: MapPinIcon },
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
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

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

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      {/* ---------- desktop / tablet pill nav ---------- */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 hidden justify-center px-4 py-4 sm:flex">
        <nav className="glass pointer-events-auto relative flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full p-1.5">
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

      {/* ---------- mobile top bar ---------- */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 py-4 sm:hidden">
        <Link
          href="/"
          className="glass pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/85"
        >
          <HomeIcon className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open ? "true" : "false"}
          className="glass pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
        >
          {open ? (
            <CloseIcon className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* ---------- mobile menu overlay ---------- */}
      {open && (
        <div className="fixed inset-0 z-30 sm:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <nav className="glass absolute inset-x-4 top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl p-2">
            {LINKS.map((link) => {
              const active = link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
              const Icon = link.Icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base ${
                    active
                      ? "bg-white/15 font-medium text-white"
                      : "text-white/70"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
