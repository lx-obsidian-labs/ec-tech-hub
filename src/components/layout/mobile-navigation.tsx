"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { navLinks } from "@/lib/site-data";
import { Icon } from "@/components/ui/icon";
import { LogoMark } from "@/components/ui/logo";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const hasOpened = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      hasOpened.current = true;
      closeRef.current?.focus();
    } else if (hasOpened.current) triggerRef.current?.focus();
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="grid min-h-11 min-w-11 place-items-center rounded-[14px] bg-white text-[var(--deep-navy)] shadow-[var(--shadow-soft)] transition hover:bg-[var(--secondary-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
      >
        <Icon name="menu" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="mobile-navigation-title" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
          <button className="absolute inset-0 cursor-default bg-[var(--deep-navy)]/30 backdrop-blur-sm" aria-label="Close navigation menu" onClick={() => setOpen(false)} />
          <div className="absolute right-3 top-3 flex max-h-[calc(100vh-24px)] w-[min(390px,calc(100vw-24px))] flex-col overflow-auto rounded-[24px] bg-white p-4 shadow-[0_24px_80px_rgba(11,18,32,0.24)] motion-safe:animate-drawer-in">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--divider)] pb-4">
              <h2 id="mobile-navigation-title" className="sr-only">Mobile navigation</h2><LogoMark />
              <button
                type="button"
                ref={closeRef}
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="grid min-h-11 min-w-11 place-items-center rounded-[14px] bg-[var(--page-bg)] text-[var(--deep-navy)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
              >
                <Icon name="close" />
              </button>
            </div>
            <nav className="grid gap-1 py-4" aria-label="Mobile primary navigation">
              {navLinks.map((link, index) => (
                <Link key={`${link.href}-${index}`} href={link.href} onClick={() => setOpen(false)} className="rounded-[14px] px-4 py-3 text-base font-semibold text-[var(--deep-navy)] transition hover:bg-[var(--blue-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]">
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="grid gap-3 border-t border-[var(--divider)] pt-4">
              <Link href="/repairs/new" onClick={() => setOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--brand-blue)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(21,94,239,0.22)]">
                Request Repair
              </Link>
              <Link href="/join/technician" onClick={() => setOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--blue-surface)] px-5 text-sm font-semibold text-[var(--brand-blue)]">
                Join as Technician
              </Link>
              <Link href="/auth/sign-in" onClick={() => setOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-[14px] px-5 text-sm font-semibold text-[var(--deep-navy)]">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
