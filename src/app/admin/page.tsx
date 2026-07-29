import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

const adminAreas = [
  ["Verification queue", "Review technician and business submissions from private evidence tables."],
  ["Account states", "Inspect suspended, incomplete, duplicate, or unsupported account states."],
  ["Marketplace moderation", "Approve only accurate listings from real sellers before public display."],
  ["Content publishing", "Manage learning content and prevent fabricated public metrics."],
  ["Support operations", "Route contact requests, repair disputes, and reporting workflows."],
  ["Security review", "Monitor role assignments and ensure admins are assigned only through secure backend processes."],
];

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/admin");
  const profile = await getCurrentProfile();
  if (profile?.role !== "administrator") redirect("/unauthorized");
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-12 sm:py-16 lg:py-20">
        <div className="rounded-[32px] bg-[var(--deep-navy)] p-8 text-white shadow-[var(--shadow-soft)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Administrator</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl">EC TECH HUB operations console.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-50">This protected area is available only to administrator profiles assigned outside public registration. Connect Supabase admin tables and RLS policies before performing live moderation.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{adminAreas.map(([title, text]) => <article key={title} className="rounded-[24px] bg-white p-6 shadow-[var(--shadow-soft)]"><h2 className="text-lg font-bold text-[var(--deep-navy)]">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--secondary-text)]">{text}</p></article>)}</div>
        <div className="mt-8 rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8"><h2 className="text-2xl font-bold text-[var(--deep-navy)]">Configuration checklist</h2><p className="mt-3 leading-7 text-[var(--secondary-text)]">Before public admin use, configure RLS policies, storage buckets, audit logging, and privileged role assignment outside the browser.</p><ButtonLink href="/verification" variant="secondary" className="mt-5">Review trust model</ButtonLink></div>
      </section>
    </main>
  );
}
