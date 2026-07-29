import { ButtonLink } from "@/components/ui/button";

export default function Page() {
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 text-center shadow-[var(--shadow-soft)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--danger)]">Access blocked</p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">You do not have access to this area.</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--secondary-text)]">Your account role or approval state does not match the protected page you tried to open. If this looks wrong, contact support instead of creating another account.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><ButtonLink href="/dashboard">Go to dashboard</ButtonLink><ButtonLink href="/contact?topic=account" variant="secondary">Contact support</ButtonLink><ButtonLink href="/help" variant="tertiary">Help center</ButtonLink></div>
        </div>
      </section>
    </main>
  );
}
