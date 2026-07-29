"use client";

import { ButtonLink } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="bg-[var(--page-bg)]"><section className="container-grid py-12"><div className="rounded-[32px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
    <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--danger)]">Marketplace error</p>
    <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--deep-navy)]">Marketplace could not be loaded.</h1>
    <p className="mt-3 max-w-2xl leading-7 text-[var(--secondary-text)]">A network or server issue prevented the technology catalog from loading. No product data has been fabricated.</p>
    <p className="mt-3 rounded-2xl bg-[var(--secondary-surface)] p-4 text-xs text-[var(--muted-text)]">{error.digest ? `Reference: ${error.digest}` : "Please retry the request."}</p>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button onClick={reset} className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--brand-blue)] px-5 text-sm font-bold text-white">Retry loading</button><ButtonLink href="/" variant="secondary">Return Home</ButtonLink></div>
  </div></section></main>;
}