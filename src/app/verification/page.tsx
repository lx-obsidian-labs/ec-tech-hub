import Link from "next/link";

const stages = [
  ["Contact and identity", "Confirm basic contact details and profile ownership."],
  ["Skills and proof", "Review categories, experience, work examples, and certificates where relevant."],
  ["Ongoing reputation", "Use service history, feedback, reports, and moderation to maintain trust."],
];

export default function Page() {
  return <main id="main-content" className="bg-[var(--page-bg)]"><section className="container-grid py-16 sm:py-20 lg:py-24"><div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Verification</p><h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Technology support built around layered trust.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--secondary-text)]">Verification improves confidence through profile review, proof of work, feedback, and moderation. It does not guarantee outcomes or replace personal judgment.</p></div><div className="mt-8 grid gap-4 md:grid-cols-3">{stages.map(([title, text], index) => <article key={title} className="rounded-[24px] bg-white p-6 shadow-[var(--shadow-soft)]"><div className="grid size-10 place-items-center rounded-2xl bg-[var(--blue-surface)] text-sm font-bold text-[var(--brand-blue)]">{index + 1}</div><h2 className="mt-5 text-lg font-bold text-[var(--deep-navy)]">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--secondary-text)]">{text}</p></article>)}</div><div className="mt-8 rounded-[28px] bg-[var(--deep-navy)] p-6 text-white"><h2 className="text-2xl font-bold">Apply carefully</h2><p className="mt-3 text-blue-50">Technicians and businesses submit information for review. Sensitive documents should be stored privately when Supabase Storage policies are configured.</p><Link href="/join/technician" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-[14px] bg-white px-5 text-sm font-semibold text-[var(--brand-blue)]">Apply as technician</Link></div></section></main>;
}
