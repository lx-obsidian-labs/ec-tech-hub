"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

const examples = [
  "My phone screen is broken",
  "Find a laptop technician",
  "Diagnose a slow computer",
  "Explore refurbished devices",
];

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/ai-assist${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="mt-8 rounded-[22px] bg-white p-3 shadow-[0_18px_45px_rgba(11,18,32,0.12)] ring-1 ring-[var(--divider)]">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row" role="search" aria-label="Technology support search">
        <label className="sr-only" htmlFor="hero-search">What do you need help with today?</label>
        <div className="flex min-h-14 flex-1 items-center gap-3 rounded-[16px] bg-[var(--page-bg)] px-4 text-[var(--deep-navy)] focus-within:ring-2 focus-within:ring-[var(--brand-blue)]">
          <Icon name="search" className="size-5 text-[var(--muted-text)]" />
          <input
            id="hero-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="What do you need help with today?"
            autoComplete="off"
            className="w-full bg-transparent text-base outline-none placeholder:text-[var(--muted-text)]"
          />
        </div>
        <button type="submit" className="min-h-14 rounded-[16px] bg-[var(--deep-navy)] px-6 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-[#111d31] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]">
          Get guidance
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2 px-1" aria-label="Example searches">
        {examples.map((example) => (
          <button key={example} type="button" onClick={() => setQuery(example)} className="rounded-full bg-[var(--blue-surface)] px-3 py-1.5 text-xs font-medium text-[var(--brand-blue)] transition hover:bg-[#dce9ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]">
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
