import Link from "next/link";
import { LogoMark } from "@/components/ui/logo";

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main id="main-content" className="min-h-screen bg-[var(--page-bg)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="network-bg fixed inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-[1180px] items-center gap-8 lg:grid-cols-[0.9fr_1fr]">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex rounded-[18px] bg-white p-3 shadow-[var(--shadow-soft)]"><LogoMark /></Link>
          <h1 className="mt-10 max-w-xl text-5xl font-bold leading-[1.05] tracking-[-0.05em] text-[var(--deep-navy)]">Secure access to Africa’s trusted technology ecosystem.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--secondary-text)]">Manage repairs, onboarding, services, marketplace activity, and learning from one calm, protected account experience.</p>
          <div className="mt-8 grid max-w-lg gap-3 text-sm text-[var(--secondary-text)]">
            <p className="rounded-[16px] bg-white/80 p-4 shadow-[var(--shadow-soft)]">Your account type controls the next onboarding step.</p>
            <p className="rounded-[16px] bg-white/80 p-4 shadow-[var(--shadow-soft)]">Administrator access cannot be self-registered.</p>
          </div>
        </section>
        <section className="mx-auto w-full max-w-[500px] rounded-[28px] bg-white p-6 shadow-[0_24px_80px_rgba(11,18,32,0.12)] sm:p-8 lg:p-10">
          <div className="mb-8 lg:hidden"><LogoMark /></div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">EC TECH HUB</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-[var(--deep-navy)] sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--secondary-text)] sm:text-base">{description}</p>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
