import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { RepairTrackingActions } from "@/components/repairs/repair-tracking-actions";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

type Json = Record<string, unknown>;
type RepairRow = Json & {
  id: string;
  reference: string;
  profile_id: string;
  auth_user_id: string;
  status: string;
  submitted_at: string;
  updated_at: string;
  device_category: string;
  brand: string;
  model: string;
  approximate_age: string;
  warranty_status: string | null;
  purchase_date: string | null;
  problem_title: string;
  problem_description: string;
  symptoms: string;
  started_when: string;
  repaired_before: boolean;
  urgency: string;
  province: string;
  city: string;
  area: string;
  service_preference: string;
  location_notes: string | null;
};
type EventRow = { id: string; status: string; title: string; description: string | null; responsible_party: string; created_at: string };
type UpdateRow = { id: string; title: string; message: string; author_role: string; created_at: string };
type AttachmentRow = { id: string; storage_bucket: string; storage_path: string; file_name: string; content_type: string; file_size_bytes: number; created_at: string; signedUrl?: string };
type QuoteRow = { id: string; labour_amount: number | null; parts_amount: number | null; additional_fees_amount: number | null; currency: string; status: string; notes: string | null; created_at: string; updated_at: string };
type NotificationRow = { id: string; type: string; title: string; message: string | null; read_at: string | null; created_at: string };
type ProfileRow = { id: string; full_name: string | null; display_name: string | null; avatar_url: string | null; province: string | null; city: string | null };
type TechnicianProfileRow = { headline: string | null; service_area: string | null; verification_status: string | null };

const milestoneOrder = ["submitted", "awaiting_assignment", "technician_assigned", "diagnosis_started", "waiting_for_customer_approval", "repair_in_progress", "ready_for_collection", "completed"];
const statusCopy: Record<string, { label: string; description: string; icon: IconName }> = {
  submitted: { label: "Submitted", description: "Your request is saved and ready for review.", icon: "check" },
  reviewing: { label: "Awaiting Assignment", description: "EC TECH HUB is reviewing the request details before matching support.", icon: "search" },
  awaiting_assignment: { label: "Awaiting Assignment", description: "We are looking for a suitable technician or support path.", icon: "search" },
  accepted: { label: "Technician Assigned", description: "A provider has accepted or been linked to this repair.", icon: "user" },
  technician_assigned: { label: "Technician Assigned", description: "A technician is assigned and can review the device details.", icon: "user" },
  diagnosis_started: { label: "Diagnosis Started", description: "The issue is being assessed so the next step is clear.", icon: "tool" },
  waiting_for_customer_approval: { label: "Waiting for Customer Approval", description: "A quote or decision needs your approval before work continues.", icon: "shield" },
  waiting_for_parts: { label: "Waiting for Parts", description: "The repair depends on parts or materials becoming available.", icon: "device" },
  in_progress: { label: "Repair In Progress", description: "Work has started on the device.", icon: "tool" },
  repair_in_progress: { label: "Repair In Progress", description: "Work has started on the device.", icon: "tool" },
  ready_for_collection: { label: "Ready for Collection", description: "The repair is ready for collection or final handover.", icon: "pin" },
  completed: { label: "Completed", description: "The repair has been completed or confirmed.", icon: "check" },
  cancelled: { label: "Cancelled", description: "This repair request has been cancelled.", icon: "close" },
};

function label(value: string | null | undefined) {
  if (!value) return "Not available";
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function dateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function money(amount: number | null, currency: string) {
  if (amount === null || amount === undefined) return "Not provided";
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(Number(amount));
}

async function safeSelect<T>(query: PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  const { data, error } = await query;
  if (error || !data) return fallback;
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return { title: `${reference} | Repair Tracking | EC TECH HUB`, description: "Track repair progress, updates, attachments, and customer actions through EC TECH HUB." };
}

export default async function Page({ params }: { params: Promise<{ reference: string }> }) {
  const user = await getCurrentUser();
  const { reference } = await params;
  if (!user) redirect(`/auth/sign-in?returnTo=/repairs/${encodeURIComponent(reference)}`);
  const supabase = await createClient();
  if (!supabase) notFound();

  const { data, error } = await supabase.from("repair_requests").select("*").eq("reference", reference).eq("auth_user_id", user.id).maybeSingle();
  if (error || !data) notFound();
  const repair = data as RepairRow;

  const [events, updates, quotes, notifications, attachments] = await Promise.all([
    safeSelect<EventRow[]>(supabase.from("repair_status_events").select("id,status,title,description,responsible_party,created_at").eq("repair_request_id", repair.id).order("created_at", { ascending: true }), []),
    safeSelect<UpdateRow[]>(supabase.from("repair_updates").select("id,title,message,author_role,created_at").eq("repair_request_id", repair.id).eq("is_public", true).order("created_at", { ascending: false }), []),
    safeSelect<QuoteRow[]>(supabase.from("repair_quotes").select("id,labour_amount,parts_amount,additional_fees_amount,currency,status,notes,created_at,updated_at").eq("repair_request_id", repair.id).order("created_at", { ascending: false }), []),
    safeSelect<NotificationRow[]>(supabase.from("repair_notifications").select("id,type,title,message,read_at,created_at").eq("repair_request_id", repair.id).eq("profile_id", repair.profile_id).order("created_at", { ascending: false }).limit(5), []),
    safeSelect<AttachmentRow[]>(supabase.from("repair_request_attachments").select("id,storage_bucket,storage_path,file_name,content_type,file_size_bytes,created_at").eq("repair_request_id", repair.id).order("created_at", { ascending: false }), []),
  ]);

  const assignedProfileId = typeof repair.assigned_technician_profile_id === "string" ? repair.assigned_technician_profile_id : null;
  const [assignedProfile, technicianProfile] = assignedProfileId ? await Promise.all([
    safeSelect<ProfileRow | null>(supabase.from("profiles").select("id,full_name,display_name,avatar_url,province,city").eq("id", assignedProfileId).maybeSingle(), null),
    safeSelect<TechnicianProfileRow | null>(supabase.from("technician_profiles").select("headline,service_area,verification_status").eq("profile_id", assignedProfileId).maybeSingle(), null),
  ]) : [null, null] as const;

  const signedAttachments = await Promise.all(attachments.map(async (item) => {
    const { data: signed } = await supabase.storage.from(item.storage_bucket || "repair-attachments").createSignedUrl(item.storage_path, 60 * 10);
    return { ...item, signedUrl: signed?.signedUrl };
  }));

  const current = statusCopy[repair.status] ?? { label: label(repair.status), description: "The repair status has been updated.", icon: "device" as IconName };
  const timelineEvents = events.length ? events : [{ id: "submitted", status: repair.status, title: current.label, description: current.description, responsible_party: "EC TECH HUB", created_at: repair.submitted_at }];
  const pendingQuote = quotes.find((quote) => quote.status === "awaiting_approval");
  const canCancel = ["submitted", "awaiting_assignment", "technician_assigned", "reviewing", "accepted"].includes(repair.status);
  const canConfirmCompletion = ["ready_for_collection", "completed"].includes(repair.status);
  const estimatedCompletion = typeof repair.estimated_completion_at === "string" ? repair.estimated_completion_at : null;
  const assignedName = assignedProfile?.display_name || assignedProfile?.full_name || "Assigned technician";

  return (
    <main id="main-content" className="bg-[var(--page-bg)] pb-24 lg:pb-0">
      <section className="container-grid py-8 sm:py-12 lg:py-16">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--secondary-text)]">
          <Link href="/dashboard" className="font-semibold text-[var(--brand-blue)] hover:underline">Dashboard</Link><span>/</span>
          <Link href="/repairs" className="font-semibold text-[var(--brand-blue)] hover:underline">Repair Hub</Link><span>/</span><span>{repair.reference}</span>
        </nav>

        <header className="rounded-[32px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">Repair tracking</p>
              <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">{repair.reference}</h1>
              <p className="mt-4 text-lg leading-8 text-[var(--secondary-text)]">{repair.brand} {repair.model} · {repair.device_category}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end"><ButtonLink href="/dashboard" variant="secondary">Return to Dashboard</ButtonLink></div>
          </div>
          <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Device" value={`${repair.brand} ${repair.model}`} />
            <InfoCard label="Submitted" value={dateTime(repair.submitted_at)} />
            <InfoCard label="Current status" value={current.label} />
            <InfoCard label="Assigned technician" value={assignedProfile ? assignedName : "Not assigned yet"} />
          </dl>
        </header>

        <StatusBanner status={current.label} description={current.description} icon={current.icon} timestamp={dateTime(repair.updated_at || repair.submitted_at)} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)] lg:items-start">
          <div className="grid gap-8">
            <ProgressTimeline currentStatus={repair.status} events={timelineEvents} />
            <RepairDetails repair={repair} attachments={signedAttachments} />
            <Updates updates={updates} />
            <RepairHistory events={timelineEvents} />
          </div>
          <aside className="grid gap-6 lg:sticky lg:top-24">
            <RepairTrackingActions reference={repair.reference} profileId={repair.profile_id} canCancel={canCancel} canConfirmCompletion={canConfirmCompletion} pendingQuoteId={pendingQuote?.id} />
            <TechnicianPanel profile={assignedProfile} technician={technicianProfile} reference={repair.reference} />
            <QuotePanel quotes={quotes} />
            <EstimatePanel date={estimatedCompletion} confidence={typeof repair.estimated_completion_confidence === "string" ? repair.estimated_completion_confidence : null} />
            <Notifications notifications={notifications} />
          </aside>
        </div>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--divider)] bg-white/95 p-3 shadow-[0_-10px_30px_rgba(11,18,32,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-3"><Link href={`/contact?topic=repairs&reference=${encodeURIComponent(repair.reference)}`} className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-white px-4 text-sm font-semibold text-[var(--deep-navy)] ring-1 ring-[var(--divider)]">Message</Link><Link href="/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--brand-blue)] px-4 text-sm font-semibold text-white">Dashboard</Link></div>
      </div>
    </main>
  );
}

function StatusBanner({ status, description, icon, timestamp }: { status: string; description: string; icon: IconName; timestamp: string }) {
  return <section className="mt-6 rounded-[28px] bg-[var(--deep-navy)] p-6 text-white shadow-[var(--shadow-soft)] sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15"><Icon name={icon} className="size-7 text-white" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Current status</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.02em]">{status}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">{description}</p></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-blue-50 ring-1 ring-white/15"><span className="block text-xs uppercase tracking-[0.14em] text-blue-100">Last updated</span><strong className="mt-1 block text-white">{timestamp}</strong></div></div></section>;
}

function ProgressTimeline({ currentStatus, events }: { currentStatus: string; events: EventRow[] }) {
  const reached = Math.max(0, milestoneOrder.indexOf(currentStatus));
  return <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8"><h2 className="text-2xl font-bold text-[var(--deep-navy)]">Progress timeline</h2><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">Milestones are shown in order so you can see what has happened and what may happen next.</p><ol className="mt-7 space-y-0" aria-label="Repair progress milestones">{milestoneOrder.map((status, index) => { const copy = statusCopy[status]; const event = events.find((item) => item.status === status); const isDone = Boolean(event) || index < reached; const isCurrent = status === currentStatus || (!milestoneOrder.includes(currentStatus) && index === 0); return <li key={status} className="relative flex gap-4 pb-7 last:pb-0"><span className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full ring-4 ring-white ${isCurrent ? "bg-[var(--brand-blue)] text-white motion-safe:animate-pulse" : isDone ? "bg-[var(--trust-green)] text-white" : "bg-[var(--secondary-surface)] text-[var(--muted-text)]"}`}><Icon name={isDone ? "check" : copy.icon} className="size-5" /></span>{index < milestoneOrder.length - 1 ? <span className="absolute left-5 top-10 h-[calc(100%-2.5rem)] w-px bg-[var(--divider)]" aria-hidden="true" /> : null}<div className="min-w-0 rounded-2xl bg-[var(--secondary-surface)] p-4 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-[var(--deep-navy)]">{copy.label}</h3><span className="text-xs font-semibold text-[var(--muted-text)]">{event ? dateTime(event.created_at) : isCurrent ? "Current" : "Pending"}</span></div><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">{event?.description || copy.description}</p><p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-text)]">Responsible: {event?.responsible_party || (isCurrent ? "EC TECH HUB" : "Pending")}</p></div></li>; })}</ol></section>;
}

function RepairDetails({ repair, attachments }: { repair: RepairRow; attachments: AttachmentRow[] }) {
  return <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8"><h2 className="text-2xl font-bold text-[var(--deep-navy)]">Repair details</h2><dl className="mt-6 grid gap-4 sm:grid-cols-2"><Detail label="Reference" value={repair.reference} /><Detail label="Device" value={`${repair.device_category} · ${repair.brand} ${repair.model}`} /><Detail label="Approximate age" value={repair.approximate_age} /><Detail label="Warranty" value={repair.warranty_status || "Not provided"} /><Detail label="Problem" value={repair.problem_title} /><Detail label="Symptoms" value={repair.symptoms} /><Detail label="Started" value={repair.started_when} /><Detail label="Repaired before" value={repair.repaired_before ? "Yes" : "No"} /><Detail label="Preferred service" value={label(repair.service_preference)} /><Detail label="Location" value={`${repair.area}, ${repair.city}, ${repair.province}`} /><Detail label="Created" value={dateTime(repair.submitted_at)} /><Detail label="Last updated" value={dateTime(repair.updated_at)} /></dl><div className="mt-6 rounded-2xl bg-[var(--secondary-surface)] p-5"><h3 className="font-bold text-[var(--deep-navy)]">Problem description</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--secondary-text)]">{repair.problem_description}</p></div><PhotoGallery attachments={attachments} /></section>;
}

function PhotoGallery({ attachments }: { attachments: AttachmentRow[] }) {
  const images = attachments.filter((item) => item.content_type.startsWith("image/") && item.signedUrl);
  const files = attachments.filter((item) => !item.content_type.startsWith("image/"));
  return <section className="mt-7"><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-[var(--deep-navy)]">Photos and attachments</h3><span className="text-sm text-[var(--muted-text)]">{attachments.length} file{attachments.length === 1 ? "" : "s"}</span></div>{attachments.length ? <><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{images.map((item) => <a key={item.id} href={item.signedUrl} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-2xl bg-[var(--secondary-surface)] ring-1 ring-[var(--divider)]"><Image src={item.signedUrl!} alt={`Attachment: ${item.file_name}`} fill sizes="(max-width: 768px) 45vw, 180px" className="object-cover transition group-hover:scale-[1.03]" /></a>)}</div>{files.length ? <div className="mt-4 grid gap-2">{files.map((item) => <a key={item.id} href={item.signedUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-[var(--secondary-surface)] p-4 text-sm font-semibold text-[var(--deep-navy)]">{item.file_name} · {Math.ceil(item.file_size_bytes / 1024)} KB</a>)}</div> : null}</> : <EmptyState title="No attachments yet" body="Photos or documents uploaded during intake or later updates will appear here." />}</section>;
}

function TechnicianPanel({ profile, technician, reference }: { profile: ProfileRow | null; technician: TechnicianProfileRow | null; reference: string }) {
  if (!profile) return <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)]"><h2 className="text-lg font-bold text-[var(--deep-navy)]">Technician</h2><EmptyState title="We're looking for the right technician." body="We'll notify you once your request has been accepted." /></section>;
  const name = profile.display_name || profile.full_name || "Assigned technician";
  const verified = technician?.verification_status === "approved";
  return <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)]"><h2 className="text-lg font-bold text-[var(--deep-navy)]">Assigned technician</h2><div className="mt-5 flex items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-[var(--blue-surface)] text-lg font-bold text-[var(--brand-blue)]">{name.charAt(0)}</div><div><h3 className="font-bold text-[var(--deep-navy)]">{name}</h3><p className="text-sm text-[var(--secondary-text)]">{technician?.headline || "Technical support provider"}</p></div></div><div className="mt-4 grid gap-2 text-sm text-[var(--secondary-text)]"><p>{verified ? "Verified technician" : "Verification badge not shown"}</p><p>{technician?.service_area || [profile.city, profile.province].filter(Boolean).join(", ") || "Location not provided"}</p></div><div className="mt-5 grid gap-3"><Link href={`/contact?topic=repairs&reference=${encodeURIComponent(reference)}`} className="inline-flex min-h-11 items-center justify-center rounded-[14px] bg-[var(--brand-blue)] px-4 text-sm font-semibold text-white">Contact Technician</Link><Link href={`/technicians?profile=${profile.id}`} className="inline-flex min-h-11 items-center justify-center rounded-[14px] bg-white px-4 text-sm font-semibold text-[var(--deep-navy)] ring-1 ring-[var(--divider)]">View Profile</Link></div></section>;
}

function Updates({ updates }: { updates: UpdateRow[] }) { return <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8"><h2 className="text-2xl font-bold text-[var(--deep-navy)]">Technician updates</h2>{updates.length ? <div className="mt-6 grid gap-4">{updates.map((item) => <article key={item.id} className="rounded-2xl bg-[var(--secondary-surface)] p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-[var(--deep-navy)]">{item.title}</h3><span className="text-xs font-semibold text-[var(--muted-text)]">{dateTime(item.created_at)}</span></div><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">{item.message}</p><p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-text)]">Author: {label(item.author_role)}</p></article>)}</div> : <EmptyState title="No updates yet." body="Diagnosis notes, public technician messages, and repair progress updates will appear here." />}</section>; }
function RepairHistory({ events }: { events: EventRow[] }) { return <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8"><h2 className="text-2xl font-bold text-[var(--deep-navy)]">Repair history</h2><div className="mt-6 grid gap-3">{events.map((event) => <div key={event.id} className="rounded-2xl bg-[var(--secondary-surface)] p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold text-[var(--deep-navy)]">{event.title}</p><p className="text-xs font-semibold text-[var(--muted-text)]">{dateTime(event.created_at)}</p></div><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">{event.description || statusCopy[event.status]?.description || "Status updated."}</p></div>)}</div></section>; }

function QuotePanel({ quotes }: { quotes: QuoteRow[] }) { const quote = quotes[0]; if (!quote) return <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)]"><h2 className="text-lg font-bold text-[var(--deep-navy)]">Cost estimate</h2><EmptyState title="No quotation yet" body="Costs will only appear after a real technician or provider creates a quotation." /></section>; const total = Number(quote.labour_amount || 0) + Number(quote.parts_amount || 0) + Number(quote.additional_fees_amount || 0); return <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)]"><h2 className="text-lg font-bold text-[var(--deep-navy)]">Cost estimate</h2><dl className="mt-5 grid gap-3"><Cost label="Labour" value={money(quote.labour_amount, quote.currency)} /><Cost label="Parts" value={money(quote.parts_amount, quote.currency)} /><Cost label="Additional fees" value={money(quote.additional_fees_amount, quote.currency)} /><Cost label="Total" value={money(total, quote.currency)} strong /></dl><p className="mt-4 rounded-2xl bg-[var(--blue-surface)] p-3 text-sm font-semibold text-[var(--brand-blue)]">Status: {label(quote.status)}</p>{quote.notes ? <p className="mt-3 text-sm leading-6 text-[var(--secondary-text)]">{quote.notes}</p> : null}</section>; }
function EstimatePanel({ date, confidence }: { date: string | null; confidence: string | null }) { return <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)]"><h2 className="text-lg font-bold text-[var(--deep-navy)]">Estimated completion</h2>{date ? <div className="mt-4"><p className="text-2xl font-bold text-[var(--deep-navy)]">{dateTime(date)}</p>{confidence ? <p className="mt-2 text-sm text-[var(--secondary-text)]">Confidence: {label(confidence)}</p> : null}<p className="mt-3 text-xs leading-5 text-[var(--muted-text)]">Estimated dates may change.</p></div> : <EmptyState title="No estimate yet" body="An estimated completion date will only appear when it is provided by the repair workflow." />}</section>; }
function Notifications({ notifications }: { notifications: NotificationRow[] }) { return <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)]"><h2 className="text-lg font-bold text-[var(--deep-navy)]">Recent notifications</h2>{notifications.length ? <div className="mt-4 grid gap-3">{notifications.map((item) => <article key={item.id} className="rounded-2xl bg-[var(--secondary-surface)] p-4"><p className="text-sm font-bold text-[var(--deep-navy)]">{item.title}</p>{item.message ? <p className="mt-1 text-sm leading-6 text-[var(--secondary-text)]">{item.message}</p> : null}<p className="mt-2 text-xs font-semibold text-[var(--muted-text)]">{dateTime(item.created_at)}</p></article>)}</div> : <EmptyState title="No repair notifications" body="Status changes, quote alerts, and completion notices will appear here." />}</section>; }

function InfoCard({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[var(--secondary-surface)] p-4"><dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted-text)]">{label}</dt><dd className="mt-2 break-words text-sm font-bold text-[var(--deep-navy)]">{value}</dd></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted-text)]">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--deep-navy)]">{value || "Not provided"}</dd></div>; }
function Cost({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="flex items-center justify-between gap-4 border-b border-[var(--divider)] pb-2 last:border-0"><dt className="text-sm text-[var(--secondary-text)]">{label}</dt><dd className={`text-sm ${strong ? "font-bold text-[var(--deep-navy)]" : "font-semibold text-[var(--deep-navy)]"}`}>{value}</dd></div>; }
function EmptyState({ title, body }: { title: string; body: string }) { return <div className="mt-4 rounded-2xl bg-[var(--secondary-surface)] p-5"><p className="font-bold text-[var(--deep-navy)]">{title}</p><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">{body}</p></div>; }