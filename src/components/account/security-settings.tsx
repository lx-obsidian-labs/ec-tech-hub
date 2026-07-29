import { signOut } from "@/lib/auth/actions";

export function LogoutButton() {
  return <form action={signOut}><button className="inline-flex min-h-11 items-center justify-center rounded-[14px] bg-[var(--deep-navy)] px-5 text-sm font-semibold text-white transition hover:bg-[#111d31] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]">Sign Out</button></form>;
}

export function SecuritySettings({ email }: { email?: string | null }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[22px] bg-white p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-blue)]">Primary identity</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--deep-navy)]">Email address</h2>
            <p className="mt-2 text-[var(--secondary-text)]">{email || "No email address available from the current session."}</p>
          </div>
          <span className="inline-flex rounded-full bg-[var(--trust-green-surface)] px-3 py-1 text-xs font-semibold text-[#087345]">Session verified</span>
        </div>
      </section>
      <section className="rounded-[22px] bg-white p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[var(--deep-navy)]">Password recovery</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">Password changes are handled through secure Supabase recovery links. Use password reset when you need to rotate credentials.</p>
        <a href="/auth/forgot-password" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[14px] bg-[var(--blue-surface)] px-5 text-sm font-semibold text-[var(--brand-blue)]">Send password reset link</a>
      </section>
      <section className="rounded-[22px] bg-white p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[var(--deep-navy)]">Connected providers</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">Google account details should be shown only when Supabase provider identity data is available. No provider connection is fabricated here.</p>
      </section>
      <section className="rounded-[22px] bg-white p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[var(--deep-navy)]">Active session</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">Sign out securely on this device. Sign-out clears the Supabase session cookie and returns you to the sign-in flow.</p>
        <div className="mt-5"><LogoutButton /></div>
      </section>
      <section className="rounded-[22px] bg-red-50 p-6 ring-1 ring-red-100">
        <h2 className="text-xl font-semibold text-[var(--deep-navy)]">Account deletion</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">Deletion requires a backend policy and confirmation workflow so repairs, verification evidence, and provider records are handled safely. Contact support to request deletion until that workflow is configured.</p>
        <a href="/contact?topic=privacy" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[14px] bg-white px-5 text-sm font-semibold text-[var(--danger)] shadow-[var(--shadow-soft)]">Request account deletion help</a>
      </section>
    </div>
  );
}
