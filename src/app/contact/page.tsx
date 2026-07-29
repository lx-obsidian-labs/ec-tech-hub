import Link from "next/link";
import { redirect } from "next/navigation";

async function sendContact(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const topic = String(formData.get("topic") || "general").trim();
  if (!name || !email.includes("@") || message.length < 10) redirectToContact("error", topic);
  redirectToContact("prepared", topic);
}

function redirectToContact(status: string, topic: string): never {
  redirect(`/contact?status=${status}&topic=${encodeURIComponent(topic)}`);
}

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; topic?: string; service?: string }> }) {
  const params = await searchParams;
  const prepared = params.status === "prepared";
  const error = params.status === "error";
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Contact</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Reach EC TECH HUB with a clear request.</h1>
            <p className="mt-5 text-lg leading-8 text-[var(--secondary-text)]">Use this form for support, partnerships, marketplace questions, technician applications, or digital services.</p>
            <div className="mt-8 grid gap-3 text-sm leading-6 text-[var(--secondary-text)]">
              <p><strong className="text-[var(--deep-navy)]">No fake ticket is created.</strong> Without a configured backend inbox, this page validates your message and prepares the next action honestly.</p>
              <Link href="/help" className="font-semibold text-[var(--brand-blue)]">Read help guidance →</Link>
            </div>
          </div>
          <form action={sendContact} className="rounded-[32px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
            {prepared ? <div role="status" className="mb-5 rounded-2xl bg-[var(--trust-green-surface)] p-4 text-sm font-medium text-[#087345]">Your message details are valid. Configure a support inbox or Supabase table to store contact submissions.</div> : null}
            {error ? <div role="alert" className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-[var(--danger)]">Add your name, a valid email address, and a message of at least 10 characters.</div> : null}
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-[var(--deep-navy)]">Full name<input name="name" required autoComplete="name" className="min-h-14 rounded-2xl border border-[var(--divider)] px-4 outline-none focus:ring-2 focus:ring-[var(--brand-blue)]" /></label>
              <label className="grid gap-2 text-sm font-semibold text-[var(--deep-navy)]">Email<input name="email" required type="email" autoComplete="email" className="min-h-14 rounded-2xl border border-[var(--divider)] px-4 outline-none focus:ring-2 focus:ring-[var(--brand-blue)]" /></label>
            </div>
            <label className="mt-5 grid gap-2 text-sm font-semibold text-[var(--deep-navy)]">Topic<select name="topic" defaultValue={params.topic || params.service || "general"} className="min-h-14 rounded-2xl border border-[var(--divider)] px-4 outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"><option value="general">General support</option><option value="repairs">Repair request</option><option value="marketplace">Marketplace</option><option value="services">Digital services</option><option value="technician">Technician application</option><option value="partnership">Partnership</option></select></label>
            <label className="mt-5 grid gap-2 text-sm font-semibold text-[var(--deep-navy)]">Message<textarea name="message" required minLength={10} className="min-h-36 rounded-2xl border border-[var(--divider)] p-4 outline-none focus:ring-2 focus:ring-[var(--brand-blue)]" placeholder="Tell us what you need, where you are, and the best next step." /></label>
            <button className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-[14px] bg-[var(--brand-blue)] px-6 font-semibold text-white">Validate message</button>
          </form>
        </div>
      </section>
    </main>
  );
}
