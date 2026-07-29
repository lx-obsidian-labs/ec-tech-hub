import Link from "next/link";
import { learningTopics } from "@/lib/site-data";

const topicDescriptions: Record<string, string> = {
  "Device repair basics": "Learn safe inspection habits, common symptoms, and when to stop before damage increases.",
  "Artificial intelligence": "Understand practical AI use, limitations, prompts, and responsible troubleshooting workflows.",
  "Networking": "Build confidence with routers, Wi-Fi, cabling, and small-office connectivity fundamentals.",
  "Cybersecurity awareness": "Recognize scams, protect accounts, and reduce everyday digital risk.",
  "Software development": "Explore web, app, and product-building concepts with practical project pathways.",
  "Digital business": "Learn how technology supports operations, marketing, service delivery, and customer trust.",
  "Technology careers": "Understand technician, support, software, design, cloud, and AI career pathways.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const params = await searchParams;
  const active = params.topic && topicDescriptions[params.topic] ? params.topic : learningTopics[0];
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-16 sm:py-20 lg:py-24">
        <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Learning Hub</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Build practical technology skills.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--secondary-text)]">Choose a learning pathway. When published articles or courses are connected, this page will display only real content.</p>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <nav aria-label="Learning topics" className="grid gap-3">
            {learningTopics.map((topic) => <Link key={topic} href={`/learn?topic=${encodeURIComponent(topic)}`} className={`rounded-2xl bg-white p-4 text-sm font-semibold shadow-[var(--shadow-soft)] transition hover:bg-[var(--blue-surface)] ${active === topic ? "ring-2 ring-[var(--brand-blue)]" : ""}`}>{topic}</Link>)}
          </nav>
          <article className="rounded-[28px] bg-[var(--deep-navy)] p-8 text-white shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Selected pathway</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em]">{active}</h2>
            <p className="mt-4 leading-7 text-blue-50">{topicDescriptions[active]}</p>
            <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-blue-50 ring-1 ring-white/10">No fake course ratings, enrollments, or certificates are shown. Published lessons will appear here once connected.</div>
            <Link href="/auth/sign-up" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-[14px] bg-white px-5 text-sm font-semibold text-[var(--brand-blue)]">Create account to save learning</Link>
          </article>
        </div>
      </section>
    </main>
  );
}
