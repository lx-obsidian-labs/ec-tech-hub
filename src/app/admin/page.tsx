import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { AdminMarketplaceUploader } from "@/components/marketplace/admin-marketplace-uploader";

const adminAreas = [
  ["Verification queue", "Review technician and business submissions from private evidence tables."],
  ["Account states", "Inspect suspended, incomplete, duplicate, or unsupported account states."],
  ["Marketplace moderation", "Approve only accurate listings from real sellers before public display."],
  ["Content publishing", "Manage learning content and prevent fabricated public metrics."],
  ["Support operations", "Route contact requests, repair disputes, and reporting workflows."],
  ["Security review", "Monitor role assignments and ensure admins are assigned only through secure backend processes."],
];

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/admin");
  const profile = await getCurrentProfile();
  if (profile?.role !== "administrator") redirect("/unauthorized");
  const supabase = await createClient();
  const { data: products } = supabase ? await supabase.from("marketplace_products").select("id,title,category,status,created_at,is_featured").order("created_at", { ascending: false }).limit(20) : { data: [] };
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-12 sm:py-16 lg:py-20">
        <div className="rounded-[32px] bg-[var(--deep-navy)] p-8 text-white shadow-[var(--shadow-soft)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Administrator</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl">EC TECH HUB operations console.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-50">This protected area is available only to administrator profiles assigned outside public registration. Connect Supabase admin tables and RLS policies before performing live moderation.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{adminAreas.map(([title, text]) => <article key={title} className="rounded-[24px] bg-white p-6 shadow-[var(--shadow-soft)]"><h2 className="text-lg font-bold text-[var(--deep-navy)]">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--secondary-text)]">{text}</p></article>)}</div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"><AdminMarketplaceUploader /><section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8"><p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--brand-blue)]">Inventory</p><h2 className="mt-2 text-2xl font-black text-[var(--deep-navy)]">Recent marketplace items</h2><div className="mt-5 grid gap-3">{products?.length ? products.map((product) => <div key={product.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--secondary-surface)] p-4"><div><p className="font-bold text-[var(--deep-navy)]">{product.title}</p><p className="mt-1 text-xs text-[var(--muted-text)]">{product.category} · {product.status}</p></div>{product.is_featured ? <span className="rounded-full bg-[var(--blue-surface)] px-2 py-1 text-xs font-bold text-[var(--brand-blue)]">Featured</span> : null}</div>) : <p className="rounded-2xl bg-[var(--secondary-surface)] p-4 text-sm text-[var(--secondary-text)]">No marketplace products yet.</p>}</div></section></div>
        <div className="mt-8 rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8"><h2 className="text-2xl font-bold text-[var(--deep-navy)]">Configuration checklist</h2><p className="mt-3 leading-7 text-[var(--secondary-text)]">Before public admin use, configure RLS policies, storage buckets, audit logging, and privileged role assignment outside the browser.</p><ButtonLink href="/verification" variant="secondary" className="mt-5">Review trust model</ButtonLink></div>
      </section>
    </main>
  );
}
