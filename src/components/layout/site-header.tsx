import Link from "next/link";
import { navLinks } from "@/lib/site-data";
import { ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";
import { LogoutButton } from "@/components/account/security-settings";
import { getCurrentUser } from "@/lib/supabase/server";
import { MobileNavigation } from "./mobile-navigation";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const firstName = user?.user_metadata?.full_name?.split(" ")?.[0] || user?.email?.split("@")[0];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--divider)] bg-white/88 backdrop-blur-xl supports-[backdrop-filter]:bg-white/78">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-[var(--brand-blue)] focus:shadow-lg">
        Skip to content
      </a>
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-blue)]">
          <LogoMark />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {navLinks.map((link, index) => (
            <Link key={`${link.href}-${index}`} href={link.href} className="group rounded-[12px] px-3 py-2 text-sm font-medium text-[var(--secondary-text)] transition hover:bg-[var(--blue-surface)] hover:text-[var(--brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]">
              {link.label}
              <span className="mx-auto mt-1 block h-0.5 w-0 rounded-full bg-[var(--brand-blue)] transition-all group-hover:w-5" />
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link href="/account/security" className="rounded-[12px] bg-[var(--secondary-surface)] px-3 py-2 text-sm font-semibold text-[var(--deep-navy)] transition hover:bg-[var(--blue-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]">
                {firstName || "Account"}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" className="rounded-[12px] px-3 py-2 text-sm font-semibold text-[var(--secondary-text)] transition hover:bg-[var(--secondary-surface)] hover:text-[var(--deep-navy)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]">
                Sign In
              </Link>
              <ButtonLink href="/join/technician" variant="secondary" size="sm">Join as Technician</ButtonLink>
              <ButtonLink href="/repairs/new" size="sm">Request Repair</ButtonLink>
            </>
          )}
        </div>
        <MobileNavigation />
      </div>
    </header>
  );
}
