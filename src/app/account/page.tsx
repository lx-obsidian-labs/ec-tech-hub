import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/components/account/security-settings";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/account");
  const profile = await getCurrentProfile();
  const displayName = profile?.display_name || profile?.full_name || user.email?.split("@")[0] || "Account";
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-12 sm:py-16 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <aside className="rounded-[32px] bg-[var(--deep-navy)] p-8 text-white shadow-[var(--shadow-soft)]">
            <div className="grid size-16 place-items-center rounded-2xl bg-white text-xl font-bold text-[var(--brand-blue)]">{displayName.slice(0, 1).toUpperCase()}</div>
            <h1 className="mt-5 text-4xl font-bold tracking-[-0.04em]">{displayName}</h1>
            <p className="mt-3 text-blue-50">Protected account overview for EC TECH HUB.</p>
            <div className="mt-6 flex flex-col gap-3"><ButtonLink href="/account/security" className="bg-white text-[var(--brand-blue)] hover:bg-blue-50">Security settings</ButtonLink><LogoutButton /></div>
          </aside>
          <div className="grid gap-5">
            <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
              <h2 className="text-2xl font-bold tracking-[-0.03em] text-[var(--deep-navy)]">Profile details</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Email" value={user.email || profile?.email || "Unavailable"} />
                <Field label="Role" value={profile?.role || "Not selected"} />
                <Field label="Onboarding" value={profile?.onboarding_status?.replaceAll("_", " ") || "Profile not created"} />
                <Field label="Profile ID" value={profile?.id ? "Stored in Supabase" : "Not available yet"} />
              </dl>
            </section>
            <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
              <h2 className="text-2xl font-bold tracking-[-0.03em] text-[var(--deep-navy)]">Next recommended action</h2>
              <p className="mt-3 leading-7 text-[var(--secondary-text)]">{profile ? "Keep your account secure and continue into the workspace that matches your role." : "Choose your account type so EC TECH HUB can route you to the correct onboarding flow."}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row"><ButtonLink href={profile ? "/dashboard" : "/onboarding"}>{profile ? "Go to dashboard" : "Choose role"}</ButtonLink><ButtonLink href="/help" variant="secondary">Help</ButtonLink></div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[var(--secondary-surface)] p-4"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-text)]">{label}</dt><dd className="mt-2 font-semibold capitalize text-[var(--deep-navy)]">{value}</dd></div>;
}
