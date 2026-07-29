import Link from "next/link";
import { redirect } from "next/navigation";
import { TechnicianJobsWorkspace, type TechnicianRepair } from "@/components/repairs/technician-jobs-workspace";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { createClient, getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

type RepairRow = Omit<TechnicianRepair, "customer" | "diagnoses" | "quotes" | "messages" | "events" | "updates" | "customerPhotos" | "technicianPhotos"> & { profile_id: string };
type CustomerRow = { id: string; full_name: string | null; display_name: string | null; avatar_url: string | null; phone: string | null; province: string | null; city: string | null };
type DiagnosisRow = TechnicianRepair["diagnoses"][number] & { repair_request_id: string };
type QuoteRow = TechnicianRepair["quotes"][number] & { repair_request_id: string };
type MessageRow = TechnicianRepair["messages"][number] & { repair_request_id: string };
type EventRow = TechnicianRepair["events"][number] & { repair_request_id: string };
type UpdateRow = TechnicianRepair["updates"][number] & { repair_request_id: string };
type AttachmentRow = { id: string; repair_request_id: string; storage_bucket: string; storage_path: string; file_name: string; content_type: string; created_at: string; signedUrl?: string | null };
type ProgressPhotoRow = { id: string; repair_request_id: string; storage_bucket: string; storage_path: string; caption: string | null; phase: string | null; created_at: string; signedUrl?: string | null };

export const metadata = { title: "Repair Jobs | EC TECH HUB", description: "Operational technician repair management workspace for assigned and available repair requests." };

async function safe<T>(query: PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  const { data, error } = await query;
  return error || !data ? fallback : data;
}

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/technician/jobs");
  const profile = await getCurrentProfile();
  if (profile?.role !== "technician" && profile?.role !== "administrator") redirect("/unauthorized");
  const supabase = await createClient();

  if (!supabase) return <WorkspaceError title="Repair Jobs" message="Supabase is not configured for this environment. Repair jobs cannot be loaded." />;

  const assigned = await safe<RepairRow[]>(supabase.from("repair_requests").select("*").or(`assigned_technician_profile_id.eq.${profile.id},assigned_technician_profile_id.is.null`).order("updated_at", { ascending: false }).limit(80), []);
  const repairIds = assigned.map((repair) => repair.id);
  const customerIds = Array.from(new Set(assigned.map((repair) => repair.profile_id)));

  const [customers, diagnoses, quotes, messages, events, updates, attachments, progressPhotos] = repairIds.length ? await Promise.all([
    customerIds.length ? safe<CustomerRow[]>(supabase.from("profiles").select("id,full_name,display_name,avatar_url,phone,province,city").in("id", customerIds), []) : Promise.resolve([]),
    safe<DiagnosisRow[]>(supabase.from("repair_diagnoses").select("id,repair_request_id,summary,observed_faults,required_parts,estimated_duration,complexity,priority,public_notes,private_notes,created_at,submitted_at").in("repair_request_id", repairIds).order("created_at", { ascending: false }), []),
    safe<QuoteRow[]>(supabase.from("repair_quotes").select("id,repair_request_id,version,total_amount,currency,status,notes,estimated_completion_at,warranty_note,created_at").in("repair_request_id", repairIds).order("created_at", { ascending: false }), []),
    safe<MessageRow[]>(supabase.from("repair_messages").select("id,repair_request_id,sender_role,message,created_at").in("repair_request_id", repairIds).order("created_at", { ascending: false }).limit(200), []),
    safe<EventRow[]>(supabase.from("repair_status_events").select("id,repair_request_id,status,title,description,responsible_party,created_at").in("repair_request_id", repairIds).order("created_at", { ascending: true }), []),
    safe<UpdateRow[]>(supabase.from("repair_updates").select("id,repair_request_id,title,message,author_role,is_public,created_at").in("repair_request_id", repairIds).order("created_at", { ascending: false }), []),
    safe<AttachmentRow[]>(supabase.from("repair_request_attachments").select("id,repair_request_id,storage_bucket,storage_path,file_name,content_type,created_at").in("repair_request_id", repairIds).order("created_at", { ascending: false }), []),
    safe<ProgressPhotoRow[]>(supabase.from("repair_progress_photos").select("id,repair_request_id,storage_bucket,storage_path,caption,phase,created_at").in("repair_request_id", repairIds).order("created_at", { ascending: false }), []),
  ]) : [[], [], [], [], [], [], [], []] as const;

  await Promise.all([...attachments, ...progressPhotos].map(async (item) => {
    const { data } = await supabase.storage.from(item.storage_bucket).createSignedUrl(item.storage_path, 60 * 10);
    item.signedUrl = data?.signedUrl ?? null;
  }));

  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const repairs: TechnicianRepair[] = assigned.map((repair) => ({
    ...repair,
    customer: customerById.get(repair.profile_id) ?? null,
    diagnoses: diagnoses.filter((item) => item.repair_request_id === repair.id),
    quotes: quotes.filter((item) => item.repair_request_id === repair.id),
    messages: messages.filter((item) => item.repair_request_id === repair.id),
    events: events.filter((item) => item.repair_request_id === repair.id),
    updates: updates.filter((item) => item.repair_request_id === repair.id),
    customerPhotos: attachments.filter((item) => item.repair_request_id === repair.id).map((item) => ({ id: item.id, file_name: item.file_name, content_type: item.content_type, created_at: item.created_at, signedUrl: item.signedUrl })),
    technicianPhotos: progressPhotos.filter((item) => item.repair_request_id === repair.id).map((item) => ({ id: item.id, file_name: item.caption || item.phase || "Technician photo", caption: item.caption, phase: item.phase, created_at: item.created_at, signedUrl: item.signedUrl, content_type: "image/*" })),
  }));

  const availableCount = repairs.filter((repair) => !repair.assigned_technician_profile_id).length;
  const activeCount = repairs.filter((repair) => repair.assigned_technician_profile_id === profile.id && !["completed", "cancelled"].includes(repair.status)).length;
  const urgentCount = repairs.filter((repair) => ["urgent", "safety"].includes(repair.urgency) && !["completed", "cancelled"].includes(repair.status)).length;
  const approvalCount = repairs.filter((repair) => ["quotation_sent", "waiting_for_customer_approval", "quotation_rejected"].includes(repair.status)).length;

  return <main id="main-content" className="bg-[var(--page-bg)]">
    <section className="container-grid py-8 sm:py-10 lg:py-12">
      <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-2 text-sm text-[var(--secondary-text)]"><Link href="/technician/dashboard" className="font-semibold text-[var(--brand-blue)] hover:underline">Technician Dashboard</Link><span>/</span><span>Repair Jobs</span></nav>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Technician workspace</p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Repair Jobs</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--secondary-text)]">Manage all assigned and available repair requests.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end"><ButtonLink href="/technician/dashboard" variant="secondary">Dashboard</ButtonLink><ButtonLink href="/repairs" variant="tertiary">Customer repair flow</ButtonLink><button type="button" aria-label="Notifications" className="grid min-h-12 min-w-12 place-items-center rounded-[14px] bg-white text-[var(--deep-navy)] shadow-[var(--shadow-soft)]"><Icon name="spark" /></button></div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Active assigned" value={activeCount} tone="navy" />
        <SummaryCard label="Urgent priority" value={urgentCount} tone="danger" />
        <SummaryCard label="Awaiting approval" value={approvalCount} tone="warning" />
        <SummaryCard label="Available" value={availableCount} tone="blue" />
      </div>

      {repairs.length ? <TechnicianJobsWorkspace repairs={repairs} technicianProfileId={profile.id} /> : <div className="mt-8"><EmptyState /></div>}
    </section>
  </main>;
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "navy" | "danger" | "warning" | "blue" }) {
  const tones = { navy: "bg-[var(--deep-navy)] text-white", danger: "bg-red-50 text-red-700", warning: "bg-amber-50 text-amber-800", blue: "bg-[var(--blue-surface)] text-[var(--brand-blue)]" };
  return <article className={`rounded-[24px] p-5 shadow-[var(--shadow-soft)] ${tones[tone]}`}><p className="text-sm font-bold opacity-80">{label}</p><p className="mt-2 text-3xl font-black tracking-[-0.04em]">{value}</p></article>;
}

function EmptyState() {
  return <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10"><h2 className="text-2xl font-bold text-[var(--deep-navy)]">No active repair jobs.</h2><p className="mt-3 max-w-2xl leading-7 text-[var(--secondary-text)]">When new requests are assigned, they&apos;ll appear here. No fake repair records are displayed.</p><ButtonLink href="/technician/dashboard" className="mt-6">Browse Available Jobs</ButtonLink></div>;
}

function WorkspaceError({ title, message }: { title: string; message: string }) {
  return <main id="main-content" className="bg-[var(--page-bg)]"><section className="container-grid py-16"><div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)]"><h1 className="text-4xl font-bold text-[var(--deep-navy)]">{title}</h1><p className="mt-4 text-[var(--secondary-text)]">{message}</p><Link href="/technician/dashboard" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--brand-blue)] px-5 text-sm font-bold text-white">Return to dashboard</Link></div></section></main>;
}