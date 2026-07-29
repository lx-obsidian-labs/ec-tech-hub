import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/components/account/security-settings";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

const workspaceActions = [
  ["Request a repair", "Prepare device details and find suitable support.", "/repairs/new"],
  ["Find a technician", "Filter providers by service type and area.", "/technicians"],
  ["Use AI Assist", "Run safe structured checks before taking action.", "/ai-assist"],
  ["Explore marketplace", "Browse real approved listings when connected.", "/marketplace"],
];

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/dashboard");
  const profile = await getCurrentProfile();
  const name = profile?.display_name || profile?.full_name || user.email?.split("@")[0] || "there";
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-12 sm:py-16 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Customer workspace</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Welcome, {name}.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--secondary-text)]">Manage your technology support journey from one protected workspace. Supabase-connected repair history will appear here once your database is configured.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><ButtonLink href="/repairs/new">Request a Repair</ButtonLink><ButtonLink href="/account" variant="secondary">Account Profile</ButtonLink></div>
          </div>
          <aside className="rounded-[32px] bg-[var(--deep-navy)] p-6 text-white shadow-[var(--shadow-soft)] sm:p-8">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Account state</h2>
            <dl className="mt-5 grid gap-4 text-sm">
              <div><dt className="text-blue-100">Email</dt><dd className="mt-1 font-semibold">{user.email || "Email unavailable"}</dd></div>
              <div><dt className="text-blue-100">Role</dt><dd className="mt-1 font-semibold capitalize">{profile?.role || "Role not selected"}</dd></div>
              <div><dt className="text-blue-100">Onboarding</dt><dd className="mt-1 font-semibold capitalize">{profile?.onboarding_status?.replaceAll("_", " ") || "Profile not created"}</dd></div>
            </dl>
            {!profile ? <ButtonLink href="/onboarding" className="mt-6 bg-white text-[var(--brand-blue)] hover:bg-blue-50">Complete profile</ButtonLink> : null}
          </aside>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workspaceActions.map(([title, text, href]) => <ButtonCard key={title} title={title} text={text} href={href} />)}
        </div>
        <div className="mt-8 rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-[var(--deep-navy)]">Recent activity</h2>
          <p className="mt-3 leading-7 text-[var(--secondary-text)]">No activity is shown until real repair requests, marketplace enquiries, learning progress, or AI sessions are saved in Supabase.</p>
          <div className="mt-5"><LogoutButton /></div>
        </div>
      </section>
    </main>
  );
}

function ButtonCard({ title, text, href }: { title: string; text: string; href: string }) {
  return <ButtonLink href={href} variant="secondary" className="h-full flex-col items-start justify-start p-6 text-left"><span className="text-lg text-[var(--deep-navy)]">{title}</span><span className="mt-2 text-sm font-normal leading-6 text-[var(--secondary-text)]">{text}</span><span className="mt-4 text-sm text-[var(--brand-blue)]">Open →</span></ButtonLink>;
}
