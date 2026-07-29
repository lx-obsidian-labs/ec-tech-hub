import Link from "next/link";

const helpItems = [
  ["Request repairs", "Sign in, describe the device problem, and use the technician search summary to choose the next step.", "/repairs"],
  ["Find technicians", "Filter by service and area. Only real approved provider records should be shown once connected.", "/technicians"],
  ["Use AI Assist safely", "AI guidance is for structured checks only. Stop when a device is unsafe or needs disassembly.", "/ai-assist"],
  ["Marketplace contact", "Browse categories and contact sellers directly. EC TECH HUB does not show fake stock or process payments in this version.", "/marketplace"],
];

export default function Page() {
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-16 sm:py-20 lg:py-24">
        <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Help center</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Get practical guidance for using EC TECH HUB.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--secondary-text)]">Choose the area you need help with. Every action below opens a real route.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {helpItems.map(([title, text, href]) => <Link key={title} href={href} className="rounded-[24px] bg-white p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"><h2 className="text-lg font-bold text-[var(--deep-navy)]">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--secondary-text)]">{text}</p><span className="mt-5 inline-flex text-sm font-semibold text-[var(--brand-blue)]">Open →</span></Link>)}
        </div>
        <div className="mt-8 rounded-[28px] bg-[var(--blue-surface)] p-6"><h2 className="text-xl font-bold text-[var(--deep-navy)]">Still need help?</h2><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">Send a validated support message with enough context for the team to route it properly.</p><Link href="/contact?topic=general" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-[14px] bg-white px-5 text-sm font-semibold text-[var(--brand-blue)] shadow-[var(--shadow-soft)]">Contact support</Link></div>
      </section>
    </main>
  );
}
