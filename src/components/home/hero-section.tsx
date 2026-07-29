import Link from "next/link";
import { HeroSearch } from "./hero-search";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)]">
      <div className="network-bg absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-16">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-[var(--blue-surface)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] ring-1 ring-blue-100">
            <Icon name="shield" className="size-4" /> Technology support, trusted across Africa
          </p>
          <h1 className="mt-6 max-w-4xl text-balance text-5xl font-bold leading-[1.04] tracking-[-0.055em] text-[var(--deep-navy)] sm:text-6xl lg:text-[66px]">
            Africa’s trusted technology ecosystem.
          </h1>
          <p className="mt-6 max-w-[640px] text-pretty text-lg leading-8 text-[var(--secondary-text)] sm:text-xl">
            Find verified technicians, troubleshoot devices, explore trusted technology services, and build practical digital skills from one connected platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/repairs/new" size="lg">Request a Repair <Icon name="arrow" className="size-4" /></ButtonLink>
            <ButtonLink href="/technicians" variant="secondary" size="lg">Find a Technician</ButtonLink>
            <Link href="/ai-assist" className="inline-flex min-h-12 items-center justify-center rounded-[14px] px-4 text-sm font-semibold text-[var(--brand-blue)] transition hover:bg-[var(--blue-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]">
              Try AI Assist
            </Link>
          </div>
          <HeroSearch />
        </div>
        <EcosystemVisual />
      </div>
    </section>
  );
}

function EcosystemVisual() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-[560px] lg:max-w-none" aria-label="EC TECH HUB ecosystem preview">
      <div className="absolute left-8 top-10 h-[72%] w-[78%] rounded-[38px] bg-[var(--blue-surface)] blur-3xl" aria-hidden="true" />
      <div className="relative rounded-[32px] bg-white p-4 shadow-[0_24px_80px_rgba(11,18,32,0.12)] ring-1 ring-[var(--divider)]">
        <div className="relative min-h-[430px] overflow-hidden rounded-[24px] bg-[var(--page-bg)] p-5 sm:min-h-[500px]">
          <svg className="absolute inset-0 h-full w-full text-[var(--brand-blue)]/16" aria-hidden="true">
            <line x1="50%" y1="18%" x2="23%" y2="42%" stroke="currentColor" strokeWidth="2" strokeDasharray="6 8" />
            <line x1="50%" y1="18%" x2="72%" y2="38%" stroke="currentColor" strokeWidth="2" strokeDasharray="6 8" />
            <line x1="50%" y1="18%" x2="50%" y2="75%" stroke="currentColor" strokeWidth="2" strokeDasharray="6 8" />
            <circle cx="50%" cy="18%" r="4" fill="currentColor" />
            <circle cx="23%" cy="42%" r="4" fill="currentColor" />
            <circle cx="72%" cy="38%" r="4" fill="currentColor" />
          </svg>
          <div className="motion-safe:animate-float-slow absolute left-1/2 top-6 w-[78%] -translate-x-1/2 rounded-[22px] bg-white p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-sm font-semibold text-[var(--deep-navy)]">Laptop not powering on</p><p className="mt-1 text-xs text-[var(--muted-text)]">Laptop repair · Request ready to submit</p></div>
              <span className="rounded-full bg-[var(--trust-green-surface)] px-3 py-1 text-xs font-semibold text-[var(--trust-green)]">Ready</span>
            </div>
          </div>
          <div className="motion-safe:animate-float absolute left-3 top-[38%] w-[58%] rounded-[20px] bg-white p-4 shadow-[var(--shadow-soft)] sm:left-8 sm:w-[48%]">
            <div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-full bg-[var(--blue-surface)] text-[var(--brand-blue)]"><Icon name="user" /></span><div><p className="text-sm font-semibold text-[var(--deep-navy)]">Verified technician</p><p className="mt-1 text-xs leading-5 text-[var(--muted-text)]">Laptop and device repair · Select your area</p></div></div>
          </div>
          <div className="motion-safe:animate-float-delayed absolute right-3 top-[32%] w-[58%] rounded-[20px] bg-white p-4 shadow-[var(--shadow-soft)] sm:right-8 sm:w-[46%]">
            <p className="text-sm font-semibold text-[var(--deep-navy)]">Possible checks</p>
            <ul className="mt-3 space-y-2 text-xs text-[var(--secondary-text)]"><li>Power source</li><li>Charging cable</li><li>Battery connection</li><li className="text-[var(--danger)]">Stop if device becomes hot</li></ul>
          </div>
          <div className="motion-safe:animate-float-slower absolute bottom-5 left-1/2 w-[82%] -translate-x-1/2 rounded-[22px] bg-[var(--deep-navy)] p-5 text-white shadow-[0_18px_40px_rgba(11,18,32,0.22)]">
            <p className="text-sm font-semibold">Browse trusted listings</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">New, refurbished, accessories</p>
            <Link href="/marketplace" className="mt-4 inline-flex text-xs font-semibold text-cyan-200">Explore marketplace →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
