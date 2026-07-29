import Link from "next/link";
import { serviceCategories } from "@/lib/site-data";

export default async function Page({ searchParams }: { searchParams: Promise<{ service?: string; area?: string; problem?: string }> }) {
  const params = await searchParams;
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-16 sm:py-20 lg:py-24">
        <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Technician network</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Find technical support that fits the problem.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--secondary-text)]">Filter by service type and area. EC TECH HUB will show approved providers only when real technician records are connected.</p>
          <form action="/technicians" className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="grid gap-2 text-sm font-semibold text-[var(--deep-navy)]">Service category
              <select name="service" defaultValue={params.service || ""} className="min-h-14 rounded-2xl border border-[var(--divider)] bg-white px-4 outline-none focus:ring-2 focus:ring-[var(--brand-blue)]">
                <option value="">Any service</option>
                {serviceCategories.map((service) => <option key={service} value={service}>{service}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--deep-navy)]">City or area
              <input name="area" defaultValue={params.area || ""} placeholder="Select your area" className="min-h-14 rounded-2xl border border-[var(--divider)] bg-white px-4 outline-none focus:ring-2 focus:ring-[var(--brand-blue)]" />
            </label>
            <button className="self-end min-h-14 rounded-[14px] bg-[var(--brand-blue)] px-6 font-semibold text-white">Apply filters</button>
          </form>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] bg-[var(--deep-navy)] p-6 text-white shadow-[var(--shadow-soft)] sm:p-8">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Search summary</h2>
            <dl className="mt-5 grid gap-3 text-sm">
              <div><dt className="text-blue-100">Service</dt><dd className="font-semibold">{params.service || "Any service category"}</dd></div>
              <div><dt className="text-blue-100">Area</dt><dd className="font-semibold">{params.area || "No area selected"}</dd></div>
              {params.problem ? <div><dt className="text-blue-100">Problem note</dt><dd className="font-semibold">{params.problem}</dd></div> : null}
            </dl>
          </div>
          <div className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-[var(--deep-navy)]">We’re building the technician network in your area.</h2>
            <p className="mt-3 leading-7 text-[var(--secondary-text)]">No fake technician profiles are displayed. When Supabase technician records are approved, this section will show real specialties, locations, verification states, and reviews only when they exist.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Link href="/join/technician" className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--brand-blue)] px-5 text-sm font-semibold text-white">Join as a Technician</Link><Link href="/ai-assist" className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--blue-surface)] px-5 text-sm font-semibold text-[var(--brand-blue)]">Try AI Assist</Link></div>
          </div>
        </div>
      </section>
    </main>
  );
}
