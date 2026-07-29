import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

const setupItems = [
  ["Business profile", "Public profile details and service description from onboarding."],
  ["Verification review", "Documents and proof of representation remain private until review."],
  ["Service enquiries", "Customer contact requests will appear here once Supabase tables are connected."],
  ["Marketplace readiness", "Approved listings can be managed once inventory tables are configured."],
];

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/business/dashboard");
  const profile = await getCurrentProfile();
  if (profile?.role !== "business" && profile?.role !== "administrator") redirect("/unauthorized");
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-12 sm:py-16 lg:py-20">
        <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Business dashboard</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Manage your technology business presence.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--secondary-text)]">Your business workspace is ready for Supabase-connected profiles, verification evidence, service enquiries, and approved marketplace listings.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><ButtonLink href="/onboarding/business">Update onboarding</ButtonLink><ButtonLink href="/services" variant="secondary">Explore services</ButtonLink></div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{setupItems.map(([title, text]) => <article key={title} className="rounded-[24px] bg-white p-6 shadow-[var(--shadow-soft)]"><h2 className="text-lg font-bold text-[var(--deep-navy)]">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--secondary-text)]">{text}</p></article>)}</div>
        <section className="mt-8 rounded-[28px] bg-[var(--blue-surface)] p-6 sm:p-8"><h2 className="text-2xl font-bold text-[var(--deep-navy)]">Verification state</h2><p className="mt-3 leading-7 text-[var(--secondary-text)]">Business verification is pending until your configured backend review process approves it. No public verified badge is shown automatically.</p></section>
      </section>
    </main>
  );
}
