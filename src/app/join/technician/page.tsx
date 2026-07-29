import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";

export default async function Page() {
  const user = await getCurrentUser();
  if (user) redirect("/onboarding/technician");
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Technician network</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Apply to offer technology support.</h1>
            <p className="mt-5 text-lg leading-8 text-[var(--secondary-text)]">Create an account, choose Technician, complete your professional profile, and submit evidence for review. Verification is never granted immediately.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><ButtonLink href="/auth/sign-up">Create technician account</ButtonLink><ButtonLink href="/verification" variant="secondary">How verification works</ButtonLink></div>
          </div>
          <div className="rounded-[32px] bg-[var(--deep-navy)] p-8 text-white shadow-[var(--shadow-soft)]"><h2 className="text-2xl font-bold">What you will provide</h2><ul className="mt-5 grid gap-3 text-sm leading-6 text-blue-50"><li>• Public professional profile and service area</li><li>• Service categories and experience</li><li>• Proof of work or certificates where relevant</li><li>• Agreement to platform standards and moderation</li></ul></div>
        </div>
      </section>
    </main>
  );
}
