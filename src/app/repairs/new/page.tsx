import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { RepairRequestFlow } from "@/components/repairs/repair-request-flow";
import { loadRepairDraft } from "@/lib/repairs/actions";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Request a Repair | EC TECH HUB",
  description: "Submit a structured technology repair request through EC TECH HUB.",
};

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/repairs/new");
  const { draft, currentStep, profileId } = await loadRepairDraft();
  return (
    <main id="main-content" className="bg-[var(--page-bg)] pb-24 sm:pb-0">
      <section className="container-grid py-8 sm:py-12 lg:py-16">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-[var(--secondary-text)]">
          <Link href="/dashboard" className="font-semibold text-[var(--brand-blue)] hover:underline">Dashboard</Link>
          <span aria-hidden="true">/</span>
          <Link href="/repairs" className="font-semibold text-[var(--brand-blue)] hover:underline">Repair Hub</Link>
          <span aria-hidden="true">/</span>
          <span>Request a Repair</span>
        </nav>
        <header className="mb-8 rounded-[32px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Repair intake</p>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-[var(--deep-navy)] sm:text-5xl">Request a Repair</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--secondary-text)]">Tell us about your device and we&apos;ll help connect you with the right technician.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <ButtonLink href="#repair-flow" size="md">Start Repair</ButtonLink>
              <ButtonLink href="/dashboard" variant="secondary" size="md">Back to Dashboard</ButtonLink>
            </div>
          </div>
          <div className="mt-6 rounded-2xl bg-[var(--blue-surface)] p-4 text-sm leading-6 text-[var(--secondary-text)]">
            <strong className="text-[var(--deep-navy)]">Safety first:</strong> stop using a device that is hot, wet, swollen, sparking, smoking, or physically unsafe. Choose “Safety concern” in the urgency step.
          </div>
        </header>
        <div id="repair-flow">
          <RepairRequestFlow initialDraft={draft} initialStep={currentStep} profileId={profileId} />
        </div>
      </section>
    </main>
  );
}