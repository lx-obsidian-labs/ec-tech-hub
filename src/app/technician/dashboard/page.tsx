import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

const verificationLayers = [
  ["Contact and identity", "Confirm email, phone, location, and profile ownership."],
  ["Skills and work evidence", "Submit service categories, experience, certificates, and portfolio evidence."],
  ["Ongoing reputation", "Reviews, reports, issue resolution, and moderation are evaluated over time."],
];

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/technician/dashboard");
  const profile = await getCurrentProfile();
  if (profile?.role !== "technician" && profile?.role !== "administrator") redirect("/unauthorized");
  const params = await searchParams;
  const submitted = params.status === "submitted" || profile?.onboarding_status === "submitted";
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-12 sm:py-16 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Technician dashboard</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">{submitted ? "Your profile is ready for review." : "Build and manage your technician profile."}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--secondary-text)]">{submitted ? "We’re reviewing your information before any verification badge appears. Sensitive verification evidence should remain private in Supabase Storage." : "Complete onboarding, keep your service information accurate, and submit verification evidence when ready."}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><ButtonLink href="/technician/jobs">Open jobs workspace</ButtonLink><ButtonLink href="/technician/profile" variant="secondary">Professional profile</ButtonLink><ButtonLink href="/verification" variant="tertiary">Verification guide</ButtonLink></div>
          </div>
          <aside className="rounded-[32px] bg-[var(--deep-navy)] p-8 text-white shadow-[var(--shadow-soft)]"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Current status</p><h2 className="mt-4 text-3xl font-bold tracking-[-0.03em]">{submitted ? "Under review" : "In progress"}</h2><p className="mt-3 leading-7 text-blue-50">Verification improves confidence but does not guarantee outcomes. Do not display a verified badge until review is approved.</p></aside>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">{verificationLayers.map(([title, text], index) => <article key={title} className="rounded-[24px] bg-white p-6 shadow-[var(--shadow-soft)]"><div className="grid size-10 place-items-center rounded-2xl bg-[var(--blue-surface)] text-sm font-bold text-[var(--brand-blue)]">{index + 1}</div><h2 className="mt-5 text-lg font-bold text-[var(--deep-navy)]">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--secondary-text)]">{text}</p></article>)}</div>
      </section>
    </main>
  );
}
