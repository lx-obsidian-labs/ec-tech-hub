import Link from "next/link";
import { digitalServices } from "@/lib/site-data";

export default async function Page({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const params = await searchParams;
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Digital services</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Plan practical technology work with the right provider.</h1>
            <p className="mt-5 text-lg leading-8 text-[var(--secondary-text)]">Explore website development, automation, AI integration, cloud support, design, and IT consulting. Pricing is not displayed unless configured by real providers.</p>
            <Link href={`/contact?topic=services${params.service ? `&service=${encodeURIComponent(params.service)}` : ""}`} className="mt-8 inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--brand-blue)] px-5 text-sm font-semibold text-white">Request service guidance</Link>
          </div>
          <div className="grid gap-3">
            {digitalServices.map((service) => <Link key={service.title} href={`/services?service=${encodeURIComponent(service.title)}`} className={`group rounded-[22px] bg-white p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${params.service === service.title ? "ring-2 ring-[var(--brand-blue)]" : ""}`}><div className="flex items-center justify-between gap-4"><div><h2 className="font-bold text-[var(--deep-navy)]">{service.title}</h2><p className="mt-1 text-sm leading-6 text-[var(--secondary-text)]">{service.outcome}</p></div><span className="text-[var(--brand-blue)] transition group-hover:translate-x-1">→</span></div></Link>)}
          </div>
        </div>
      </section>
    </main>
  );
}
