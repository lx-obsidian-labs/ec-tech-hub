import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { serviceCategories } from "@/lib/site-data";

export default function Page() {
  const steps = [
    ["1", "Describe the fault", "Tell us what changed, what you already tried, and whether the device is unsafe."],
    ["2", "Add device details", "Include device type, model, area, urgency, and optional photos once storage is configured."],
    ["3", "Choose the next step", "Use AI Assist for safe checks or find a technician who fits the problem."],
    ["4", "Arrange service directly", "EC TECH HUB connects you with providers. Payments are arranged directly unless stated."],
  ];
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Repair Hub</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Get clear help for the device problem.</h1>
            <p className="mt-5 text-lg leading-8 text-[var(--secondary-text)]">Prepare a useful repair request, understand safe first checks, and choose whether to continue with AI guidance or technician discovery.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/repairs/new">Start a Repair Request</ButtonLink>
              <ButtonLink href="/technicians" variant="secondary">Find a Technician</ButtonLink>
            </div>
          </div>
          <div className="rounded-[32px] bg-[var(--deep-navy)] p-6 text-white shadow-[var(--shadow-soft)] sm:p-8">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Repair categories</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {serviceCategories.map((category) => (
                <Link key={category} href={`/technicians?service=${encodeURIComponent(category)}`} className="rounded-2xl bg-white/8 p-4 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/14 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map(([number, title, text]) => (
            <article key={number} className="rounded-[24px] bg-white p-6 shadow-[var(--shadow-soft)]">
              <div className="grid size-10 place-items-center rounded-2xl bg-[var(--blue-surface)] text-sm font-bold text-[var(--brand-blue)]">{number}</div>
              <h2 className="mt-5 text-lg font-bold text-[var(--deep-navy)]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--secondary-text)]">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
