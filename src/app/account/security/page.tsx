import { redirect } from "next/navigation";
import { SecuritySettings } from "@/components/account/security-settings";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/account/security");
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-12 sm:py-16 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <aside className="rounded-[32px] bg-[var(--deep-navy)] p-8 text-white shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Account</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Security settings</h1>
            <p className="mt-5 leading-7 text-blue-50">Manage secure access for your EC TECH HUB account. Sensitive session details are only shown when supported by Supabase Auth.</p>
            <div className="mt-8 flex flex-col gap-3"><ButtonLink href="/account" className="bg-white text-[var(--brand-blue)] hover:bg-blue-50">Account overview</ButtonLink><ButtonLink href="/dashboard" variant="dark" className="ring-1 ring-white/10">Dashboard</ButtonLink></div>
          </aside>
          <SecuritySettings email={user.email} />
        </div>
      </section>
    </main>
  );
}
