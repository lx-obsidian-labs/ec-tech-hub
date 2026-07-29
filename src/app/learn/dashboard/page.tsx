import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { learningTopics } from "@/lib/site-data";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/learn/dashboard");
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-12 sm:py-16 lg:py-20">
        <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Learning dashboard</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Continue practical technology learning.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--secondary-text)]">Published lessons, saved pathways, and progress records will appear here when your Supabase learning tables are connected.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><ButtonLink href="/learn">Explore topics</ButtonLink><ButtonLink href="/ai-assist" variant="secondary">Use AI Assist</ButtonLink></div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{learningTopics.map((topic) => <article key={topic} className="rounded-[24px] bg-white p-6 shadow-[var(--shadow-soft)]"><h2 className="text-lg font-bold text-[var(--deep-navy)]">{topic}</h2><p className="mt-3 text-sm leading-6 text-[var(--secondary-text)]">Open the public learning pathway now. Saved progress will be shown only when real learning data exists.</p><ButtonLink href={`/learn?topic=${encodeURIComponent(topic)}`} variant="tertiary" className="mt-4 px-0">Open pathway →</ButtonLink></article>)}</div>
      </section>
    </main>
  );
}
