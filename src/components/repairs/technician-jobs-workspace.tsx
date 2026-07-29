"use client";

/* eslint-disable @next/next/no-img-element -- Supabase private signed URLs are short-lived and not configured as stable Next Image remote patterns in this project. */

import Link from "next/link";
import { useMemo, useState } from "react";
import { AcceptJobButton, DiagnosisForm, MessageForm, MoreInformationForm, ProgressForm, QuotationForm } from "@/components/repairs/technician-workflow-forms";
import { Icon, type IconName } from "@/components/ui/icon";

export type TechnicianRepair = {
  id: string;
  reference: string;
  status: string;
  device_category: string;
  brand: string;
  model: string;
  approximate_age: string | null;
  warranty_status: string | null;
  purchase_date: string | null;
  problem_title: string;
  problem_description: string;
  symptoms: string;
  started_when: string | null;
  repaired_before: boolean | null;
  urgency: string;
  province: string;
  city: string;
  area: string;
  service_preference: string;
  location_notes: string | null;
  submitted_at: string;
  updated_at: string;
  assigned_at: string | null;
  estimated_completion_at: string | null;
  completed_at: string | null;
  assigned_technician_profile_id: string | null;
  customer?: CustomerProfile | null;
  diagnoses: Diagnosis[];
  quotes: Quote[];
  messages: Message[];
  events: TimelineEvent[];
  updates: RepairUpdate[];
  customerPhotos: MediaItem[];
  technicianPhotos: MediaItem[];
};

type CustomerProfile = { id: string; full_name: string | null; display_name: string | null; avatar_url: string | null; phone: string | null; province: string | null; city: string | null };
type Diagnosis = { id: string; summary: string; observed_faults: string; required_parts: string | null; estimated_duration: string | null; complexity: string; priority: string; public_notes: string | null; private_notes: string | null; created_at: string; submitted_at: string | null };
type Quote = { id: string; version: number; total_amount: number | null; currency: string; status: string; notes: string | null; estimated_completion_at: string | null; warranty_note: string | null; created_at: string };
type Message = { id: string; sender_role: string; message: string; created_at: string };
type TimelineEvent = { id: string; status: string; title: string; description: string | null; responsible_party: string; created_at: string };
type RepairUpdate = { id: string; title: string; message: string; author_role: string; is_public: boolean; created_at: string };
type MediaItem = { id: string; file_name: string; content_type?: string | null; caption?: string | null; phase?: string | null; created_at: string; signedUrl?: string | null };

const filterTabs = ["all", "available", "assigned", "diagnosis", "waiting_approval", "repairing", "testing", "ready", "completed", "cancelled"] as const;
const statusGroups: Record<string, string[]> = {
  available: ["submitted", "reviewing", "awaiting_assignment"],
  assigned: ["accepted", "technician_assigned"],
  diagnosis: ["diagnosis_started", "diagnosis_complete"],
  waiting_approval: ["waiting_for_customer_approval", "quotation_sent", "quotation_rejected"],
  repairing: ["in_progress", "repair_in_progress", "waiting_for_parts", "quality_check"],
  testing: ["testing"],
  ready: ["ready_for_collection"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

const statusMeta: Record<string, { label: string; icon: IconName; badge: string; tooltip: string }> = {
  submitted: { label: "Available", icon: "spark", badge: "bg-blue-50 text-blue-700 ring-blue-200", tooltip: "New customer request available for review." },
  reviewing: { label: "Available", icon: "search", badge: "bg-blue-50 text-blue-700 ring-blue-200", tooltip: "Request is being reviewed before assignment." },
  awaiting_assignment: { label: "Available", icon: "spark", badge: "bg-blue-50 text-blue-700 ring-blue-200", tooltip: "Open request available to technicians." },
  accepted: { label: "Accepted", icon: "check", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", tooltip: "Job has been accepted." },
  technician_assigned: { label: "Accepted", icon: "user", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", tooltip: "Technician assigned and ready to begin." },
  diagnosis_started: { label: "Diagnosis", icon: "tool", badge: "bg-indigo-50 text-indigo-700 ring-indigo-200", tooltip: "Diagnosis is in progress." },
  diagnosis_complete: { label: "Diagnosis", icon: "check", badge: "bg-indigo-50 text-indigo-700 ring-indigo-200", tooltip: "Diagnosis completed; quote may be needed." },
  waiting_for_customer_approval: { label: "Waiting Approval", icon: "shield", badge: "bg-amber-50 text-amber-800 ring-amber-200", tooltip: "Customer approval is required before repair continues." },
  quotation_sent: { label: "Waiting Approval", icon: "shield", badge: "bg-amber-50 text-amber-800 ring-amber-200", tooltip: "A quotation has been sent to the customer." },
  quotation_rejected: { label: "Waiting Approval", icon: "shield", badge: "bg-orange-50 text-orange-800 ring-orange-200", tooltip: "Customer rejected or queried the quotation." },
  in_progress: { label: "Repairing", icon: "tool", badge: "bg-cyan-50 text-cyan-800 ring-cyan-200", tooltip: "Repair work is underway." },
  repair_in_progress: { label: "Repairing", icon: "tool", badge: "bg-cyan-50 text-cyan-800 ring-cyan-200", tooltip: "Repair work is underway." },
  waiting_for_parts: { label: "Repairing", icon: "device", badge: "bg-purple-50 text-purple-800 ring-purple-200", tooltip: "Repair is waiting for parts." },
  quality_check: { label: "Repairing", icon: "shield", badge: "bg-cyan-50 text-cyan-800 ring-cyan-200", tooltip: "Quality check is underway." },
  testing: { label: "Testing", icon: "network", badge: "bg-violet-50 text-violet-800 ring-violet-200", tooltip: "Device is being tested." },
  ready_for_collection: { label: "Ready", icon: "check", badge: "bg-teal-50 text-teal-800 ring-teal-200", tooltip: "Repair is ready for handover or collection." },
  completed: { label: "Completed", icon: "check", badge: "bg-slate-100 text-slate-700 ring-slate-200", tooltip: "Repair has been completed." },
  cancelled: { label: "Cancelled", icon: "close", badge: "bg-red-50 text-red-700 ring-red-200", tooltip: "Repair request was cancelled." },
};

export function TechnicianJobsWorkspace({ repairs, technicianProfileId }: { repairs: TechnicianRepair[]; technicianProfileId: string }) {
  const [selectedId, setSelectedId] = useState(repairs[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<(typeof filterTabs)[number]>("all");
  const [device, setDevice] = useState("all");
  const [urgency, setUrgency] = useState("all");
  const [sort, setSort] = useState("priority");
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedBulk, setSelectedBulk] = useState<string[]>([]);

  const deviceTypes = useMemo(() => Array.from(new Set(repairs.map((repair) => repair.device_category).filter(Boolean))).sort(), [repairs]);
  const urgencyTypes = useMemo(() => Array.from(new Set(repairs.map((repair) => repair.urgency).filter(Boolean))).sort(), [repairs]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repairs
      .filter((repair) => tab === "all" || (statusGroups[tab] ?? []).includes(repair.status) || (tab === "assigned" && repair.assigned_technician_profile_id === technicianProfileId))
      .filter((repair) => device === "all" || repair.device_category === device)
      .filter((repair) => urgency === "all" || repair.urgency === urgency)
      .filter((repair) => !q || [repair.reference, repair.customer?.full_name, repair.customer?.display_name, repair.customer?.phone, repair.device_category, repair.brand, repair.model, repair.problem_title, repair.problem_description, repair.symptoms].some((value) => (value ?? "").toLowerCase().includes(q)))
      .sort((a, b) => {
        if (sort === "oldest") return Date.parse(a.submitted_at) - Date.parse(b.submitted_at);
        if (sort === "nearest") return `${a.city}${a.area}`.localeCompare(`${b.city}${b.area}`);
        if (sort === "priority") return urgencyRank(b.urgency) - urgencyRank(a.urgency) || Date.parse(b.updated_at) - Date.parse(a.updated_at);
        return Date.parse(b.submitted_at) - Date.parse(a.submitted_at);
      });
  }, [device, query, repairs, sort, tab, technicianProfileId, urgency]);
  const selected = repairs.find((repair) => repair.id === selectedId) ?? filtered[0] ?? repairs[0];

  return <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(320px,0.42fr)_minmax(0,1fr)]">
    <aside className="rounded-[32px] bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-hidden" aria-label="Repair list and filters">
      <RepairFilters query={query} setQuery={setQuery} tab={tab} setTab={setTab} device={device} setDevice={setDevice} urgency={urgency} setUrgency={setUrgency} sort={sort} setSort={setSort} deviceTypes={deviceTypes} urgencyTypes={urgencyTypes} />
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--divider)] pt-4">
        <p className="text-sm font-bold text-[var(--deep-navy)]">{filtered.length} jobs</p>
        <button type="button" onClick={() => { setMultiSelect(!multiSelect); setSelectedBulk([]); }} className="min-h-10 rounded-xl bg-[var(--secondary-surface)] px-3 text-xs font-bold text-[var(--secondary-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-blue)]">{multiSelect ? "Cancel bulk" : "Multi-select"}</button>
      </div>
      {multiSelect ? <BulkBar count={selectedBulk.length} /> : null}
      <div className="mt-4 grid gap-3 xl:max-h-[calc(100vh-25rem)] xl:overflow-y-auto xl:pr-1" role="listbox" aria-label="Repair jobs">
        {filtered.length ? filtered.map((repair) => <RepairCard key={repair.id} repair={repair} selected={selected?.id === repair.id} multiSelect={multiSelect} checked={selectedBulk.includes(repair.id)} onCheck={() => setSelectedBulk((current) => current.includes(repair.id) ? current.filter((id) => id !== repair.id) : [...current, repair.id])} onSelect={() => setSelectedId(repair.id)} />) : <EmptyJobs />}
      </div>
    </aside>
    <section className="min-w-0" aria-live="polite">{selected ? <RepairDetails repair={selected} isAssignedToMe={selected.assigned_technician_profile_id === technicianProfileId} /> : <EmptyJobs />}</section>
  </div>;
}

function RepairFilters(props: { query: string; setQuery(value: string): void; tab: (typeof filterTabs)[number]; setTab(value: (typeof filterTabs)[number]): void; device: string; setDevice(value: string): void; urgency: string; setUrgency(value: string): void; sort: string; setSort(value: string): void; deviceTypes: string[]; urgencyTypes: string[] }) {
  return <div>
    <label className="relative block"><span className="sr-only">Search repair jobs</span><Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--muted-text)]" /><input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="Search reference, customer, device, phone, model or issue" className="min-h-12 w-full rounded-2xl border border-[var(--divider)] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-blue)]" /></label>
    <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Status filters">{filterTabs.map((item) => <button key={item} type="button" onClick={() => props.setTab(item)} className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-bold capitalize transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-blue)] ${props.tab === item ? "bg-[var(--deep-navy)] text-white" : "bg-[var(--secondary-surface)] text-[var(--secondary-text)]"}`}>{item.replaceAll("_", " ")}</button>)}</div>
    <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3"><Select label="Device Type" value={props.device} onChange={props.setDevice} options={["all", ...props.deviceTypes]} /><Select label="Urgency" value={props.urgency} onChange={props.setUrgency} options={["all", ...props.urgencyTypes]} /><Select label="Sort" value={props.sort} onChange={props.setSort} options={["priority", "newest", "oldest", "nearest"]} /></div>
  </div>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange(value: string): void; options: string[] }) {
  return <label className="grid gap-1 text-xs font-bold text-[var(--muted-text)]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[var(--divider)] bg-white px-3 text-sm font-semibold capitalize text-[var(--deep-navy)] outline-none focus:ring-2 focus:ring-[var(--brand-blue)]">{options.map((option) => <option key={option} value={option}>{labelize(option)}</option>)}</select></label>;
}

function RepairCard({ repair, selected, multiSelect, checked, onSelect, onCheck }: { repair: TechnicianRepair; selected: boolean; multiSelect: boolean; checked: boolean; onSelect(): void; onCheck(): void }) {
  return <article role="option" aria-selected={selected} className={`rounded-[24px] border p-4 transition ${selected ? "border-[var(--brand-blue)] bg-[var(--blue-surface)] shadow-[var(--shadow-soft)]" : "border-[var(--divider)] bg-white hover:border-blue-200 hover:shadow-[var(--shadow-soft)]"}`}>
    <div className="flex items-start gap-3">{multiSelect ? <input type="checkbox" checked={checked} onChange={onCheck} aria-label={`Select ${repair.reference}`} className="mt-1 size-5 accent-[var(--brand-blue)]" /> : null}<button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-blue)]">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--brand-blue)]">{repair.reference}</p><h3 className="mt-2 line-clamp-2 font-bold text-[var(--deep-navy)]">{repair.brand} {repair.model}</h3></div><RepairStatusBadge status={repair.status} /></div>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--secondary-text)]">{repair.problem_title}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold"><Pill>{repair.customer?.display_name || repair.customer?.full_name || "Customer unavailable"}</Pill><Urgency value={repair.urgency} /><Pill>{estimateTime(repair)}</Pill></div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--muted-text)]"><span>{repair.area}, {repair.city}</span><span>{relativeTime(repair.updated_at)}</span></div>
    </button></div>
  </article>;
}

function RepairDetails({ repair, isAssignedToMe }: { repair: TechnicianRepair; isAssignedToMe: boolean }) {
  return <div className="grid gap-5 pb-28 md:pb-0">
    <header className="overflow-hidden rounded-[32px] bg-[var(--deep-navy)] text-white shadow-[var(--shadow-soft)]"><div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-start"><div><div className="flex flex-wrap items-center gap-3"><RepairStatusBadge status={repair.status} /><Urgency value={repair.urgency} /><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-50 ring-1 ring-white/10">{repair.reference}</span></div><h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{repair.problem_title}</h2><p className="mt-3 max-w-3xl leading-7 text-blue-50">{repair.brand} {repair.model} · {repair.device_category} · {labelize(repair.service_preference)}</p></div><div className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-80 lg:grid-cols-1"><DarkMetric label="Updated" value={dateTime(repair.updated_at)} /><DarkMetric label="Submitted" value={dateTime(repair.submitted_at)} /><DarkMetric label="ETA" value={repair.estimated_completion_at ? dateTime(repair.estimated_completion_at) : "Not provided"} /></div></div></header>
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]"><div className="grid min-w-0 gap-5"><section className="grid gap-5 lg:grid-cols-2"><DeviceCard repair={repair} /><CustomerCard repair={repair} /></section><ProblemDetails repair={repair} /><RepairGallery customerPhotos={repair.customerPhotos} technicianPhotos={repair.technicianPhotos} /><RepairTimeline events={repair.events} status={repair.status} /><RepairNotes diagnoses={repair.diagnoses} updates={repair.updates} /><History repair={repair} /></div><aside className="grid content-start gap-5"><RepairActions repair={repair} isAssignedToMe={isAssignedToMe} /><MessageCenter repair={repair} /></aside></div>
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--divider)] bg-white/95 p-3 shadow-[0_-10px_30px_rgba(11,18,32,0.08)] backdrop-blur md:hidden"><Link href={`/technician/jobs/${repair.reference}`} className="flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--brand-blue)] px-4 text-sm font-bold text-white">Open full workflow</Link></div>
  </div>;
}

function RepairActions({ repair, isAssignedToMe }: { repair: TechnicianRepair; isAssignedToMe: boolean }) {
  const available = !repair.assigned_technician_profile_id;
  return <section className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6"><h2 className="text-xl font-bold text-[var(--deep-navy)]">Next action</h2><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">Actions change with repair status and are processed through Supabase workflow records.</p><div className="mt-5 grid gap-4">{available ? <AcceptJobButton reference={repair.reference} /> : null}{isAssignedToMe && ["accepted", "technician_assigned", "diagnosis_started"].includes(repair.status) ? <DiagnosisForm reference={repair.reference} /> : null}{isAssignedToMe && ["diagnosis_complete", "quotation_rejected"].includes(repair.status) ? <QuotationForm reference={repair.reference} /> : null}{isAssignedToMe && ["quotation_sent", "waiting_for_customer_approval", "repair_in_progress", "in_progress", "waiting_for_parts", "testing", "quality_check", "ready_for_collection"].includes(repair.status) ? <ProgressForm reference={repair.reference} /> : null}{isAssignedToMe ? <MoreInformationForm reference={repair.reference} /> : null}{!available && !isAssignedToMe ? <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-[var(--danger)]">This repair is assigned to another technician.</p> : null}</div></section>;
}

function CustomerCard({ repair }: { repair: TechnicianRepair }) {
  const customer = repair.customer;
  const name = customer?.display_name || customer?.full_name || "Customer unavailable";
  return <section className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6"><h2 className="text-xl font-bold text-[var(--deep-navy)]">Customer information</h2><div className="mt-5 flex items-center gap-4"><div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--blue-surface)] text-lg font-black text-[var(--brand-blue)]">{customer?.avatar_url ? <img src={customer.avatar_url} alt="" className="size-full object-cover" loading="lazy" /> : name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="font-bold text-[var(--deep-navy)]">{name}</p><p className="mt-1 text-sm text-[var(--secondary-text)]">{customer?.city || repair.city}, {customer?.province || repair.province}</p></div></div><dl className="mt-5 grid gap-3 sm:grid-cols-2"><Info label="Phone" value={customer?.phone || "Not available"} /><Info label="Preferred contact" value="Not provided" /><Info label="Location" value={`${repair.area}, ${repair.city}`} /><Info label="Previous repairs" value="Only shown when real records are available" /></dl><div className="mt-5 grid gap-2 sm:grid-cols-3"><ContactButton href={customer?.phone ? `tel:${customer.phone}` : undefined}>Call</ContactButton><ContactButton href={customer?.phone ? `sms:${customer.phone}` : undefined}>Message</ContactButton><Link href={`/repairs/${repair.reference}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--secondary-surface)] px-3 text-sm font-bold text-[var(--deep-navy)]">Customer view</Link></div></section>;
}

function ContactButton({ href, children }: { href?: string; children: string }) {
  return href ? <a href={href} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--blue-surface)] px-3 text-sm font-bold text-[var(--brand-blue)]">{children}</a> : <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--secondary-surface)] px-3 text-sm font-bold text-[var(--muted-text)]" aria-disabled="true">{children}</span>;
}

function DeviceCard({ repair }: { repair: TechnicianRepair }) {
  return <section className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6"><h2 className="text-xl font-bold text-[var(--deep-navy)]">Device summary</h2><dl className="mt-5 grid gap-3 sm:grid-cols-2"><Info label="Category" value={repair.device_category} /><Info label="Brand" value={repair.brand} /><Info label="Model" value={repair.model} /><Info label="Serial Number" value="Not provided" /><Info label="Warranty" value={repair.warranty_status || "Not provided"} /><Info label="Purchase Date" value={repair.purchase_date ? dateOnly(repair.purchase_date) : "Not provided"} /><Info label="Previous Repairs" value={repair.repaired_before ? "Customer says yes" : "Customer says no"} /><Info label="Accessories Received" value="Not provided" /></dl></section>;
}

function ProblemDetails({ repair }: { repair: TechnicianRepair }) {
  return <section className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6"><h2 className="text-xl font-bold text-[var(--deep-navy)]">Problem details exactly as submitted</h2><div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]"><dl className="grid gap-3"><Info label="Problem title" value={repair.problem_title} /><Info label="Symptoms" value={repair.symptoms} /><Info label="Urgency" value={labelize(repair.urgency)} /><Info label="Preferred service" value={labelize(repair.service_preference)} /><Info label="Submission date" value={dateTime(repair.submitted_at)} /></dl><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted-text)]">Customer description</p><p className="mt-2 whitespace-pre-wrap rounded-2xl bg-[var(--secondary-surface)] p-4 text-sm leading-7 text-[var(--deep-navy)]">{repair.problem_description}</p>{repair.location_notes ? <p className="mt-3 rounded-2xl bg-[var(--blue-surface)] p-4 text-sm leading-6 text-[var(--brand-blue)]">Location note: {repair.location_notes}</p> : null}</div></div></section>;
}

function RepairGallery({ customerPhotos, technicianPhotos }: { customerPhotos: MediaItem[]; technicianPhotos: MediaItem[] }) {
  const media = [...customerPhotos.map((item) => ({ ...item, phase: item.phase || "customer" })), ...technicianPhotos];
  return <section className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-[var(--deep-navy)]">Photo gallery</h2><p className="mt-1 text-sm text-[var(--secondary-text)]">Customer and technician photos appear only when Supabase media records exist.</p></div><span className="rounded-full bg-[var(--secondary-surface)] px-3 py-1 text-xs font-bold text-[var(--secondary-text)]">{media.length} files</span></div>{media.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{media.map((item) => <a key={item.id} href={item.signedUrl || "#"} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl bg-[var(--secondary-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-blue)]"><div className="aspect-[4/3] bg-slate-100">{item.signedUrl && (item.content_type || "").startsWith("image/") ? <img src={item.signedUrl} alt={item.caption || item.file_name} loading="lazy" className="size-full object-cover transition group-hover:scale-105" /> : <div className="grid size-full place-items-center text-sm font-bold text-[var(--muted-text)]">{item.file_name}</div>}</div><div className="p-3"><p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--brand-blue)]">{labelize(item.phase || "media")}</p><p className="mt-1 line-clamp-2 text-sm font-semibold text-[var(--deep-navy)]">{item.caption || item.file_name}</p></div></a>)}</div> : <EmptyBlock title="No uploaded media" body="Customer photos, before/during/after photos, captions, and upload progress will appear when real media records exist." />}</section>;
}

function RepairTimeline({ events, status }: { events: TimelineEvent[]; status: string }) {
  return <section className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6"><h2 className="text-xl font-bold text-[var(--deep-navy)]">Repair timeline</h2>{events.length ? <ol className="mt-5 grid gap-3">{events.map((event) => <li key={event.id} className={`flex gap-3 rounded-2xl p-4 ${event.status === status ? "bg-[var(--blue-surface)] ring-1 ring-blue-200" : "bg-[var(--secondary-surface)]"}`}><span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[var(--brand-blue)]"><Icon name={statusMeta[event.status]?.icon || "check"} className="size-4" /></span><div><p className="font-bold text-[var(--deep-navy)]">{event.title}</p><p className="mt-1 text-sm leading-6 text-[var(--secondary-text)]">{event.description || labelize(event.status)}</p><p className="mt-2 text-xs font-bold text-[var(--muted-text)]">{dateTime(event.created_at)} · {labelize(event.responsible_party)}</p></div></li>)}</ol> : <EmptyBlock title="No timeline events yet" body="Submitted, assigned, diagnosis, quote, repair, testing, and completion events will appear here." />}</section>;
}

function RepairNotes({ diagnoses, updates }: { diagnoses: Diagnosis[]; updates: RepairUpdate[] }) {
  const latest = diagnoses[0];
  return <section className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6"><h2 className="text-xl font-bold text-[var(--deep-navy)]">Repair notes</h2><div className="mt-5 grid gap-4 lg:grid-cols-3"><NoteColumn title="Technician notes" body={latest ? `${latest.summary}\n\nObserved faults: ${latest.observed_faults}` : "No technician diagnosis notes yet."} /><NoteColumn title="Customer-visible notes" body={latest?.public_notes || updates.find((update) => update.is_public)?.message || "No customer-visible notes yet."} /><NoteColumn title="Internal notes" body={latest?.private_notes || "No internal notes recorded."} internal /></div></section>;
}

function NoteColumn({ title, body, internal = false }: { title: string; body: string; internal?: boolean }) {
  return <article className={`rounded-2xl p-4 ${internal ? "bg-slate-950 text-white" : "bg-[var(--secondary-surface)]"}`}><h3 className={`font-bold ${internal ? "text-white" : "text-[var(--deep-navy)]"}`}>{title}</h3><p className={`mt-3 whitespace-pre-wrap text-sm leading-6 ${internal ? "text-slate-200" : "text-[var(--secondary-text)]"}`}>{body}</p>{internal ? <p className="mt-3 text-xs font-bold text-amber-200">Never shown to customers.</p> : null}</article>;
}

function History({ repair }: { repair: TechnicianRepair }) {
  return <section className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6"><h2 className="text-xl font-bold text-[var(--deep-navy)]">Repair history</h2><div className="mt-5 grid gap-3 md:grid-cols-3"><Info label="Previous customer repairs" value={repair.repaired_before ? "Customer indicated previous repair" : "No previous repair indicated"} /><Info label="Diagnoses" value={`${repair.diagnoses.length}`} /><Info label="Quotes" value={`${repair.quotes.length}`} /></div></section>;
}

function MessageCenter({ repair }: { repair: TechnicianRepair }) {
  return <section className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6"><h2 className="text-xl font-bold text-[var(--deep-navy)]">Messages</h2><div className="mt-4"><MessageForm reference={repair.reference} /></div>{repair.messages.length ? <div className="mt-5 grid gap-3">{repair.messages.slice(0, 5).map((message) => <article key={message.id} className="rounded-2xl bg-[var(--secondary-surface)] p-4"><div className="flex justify-between gap-3"><p className="text-sm font-bold text-[var(--deep-navy)]">{labelize(message.sender_role)}</p><p className="text-xs text-[var(--muted-text)]">{dateTime(message.created_at)}</p></div><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">{message.message}</p></article>)}</div> : <EmptyBlock title="No conversation yet" body="Repair-specific messages will appear once real messages are sent." />}</section>;
}

function RepairStatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] || { label: labelize(status), icon: "tool" as IconName, badge: "bg-slate-100 text-slate-700 ring-slate-200", tooltip: labelize(status) };
  return <span title={meta.tooltip} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ring-1 ${meta.badge}`}><Icon name={meta.icon} className="size-3.5" />{meta.label}</span>;
}

function BulkBar({ count }: { count: number }) { return <div className="mt-3 rounded-2xl bg-[var(--deep-navy)] p-3 text-white"><p className="text-sm font-bold">{count} selected</p><p className="mt-1 text-xs leading-5 text-blue-100">Archive, label, export, and bulk updates require confirmation before any change. Select completed jobs to enable archive in a future workflow.</p></div>; }
function EmptyJobs() { return <div className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)]"><h3 className="text-xl font-bold text-[var(--deep-navy)]">No active repair jobs.</h3><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">When new requests are assigned, they&apos;ll appear here.</p><button type="button" className="mt-5 min-h-11 rounded-xl bg-[var(--brand-blue)] px-4 text-sm font-bold text-white">Browse Available Jobs</button></div>; }
function EmptyBlock({ title, body }: { title: string; body: string }) { return <div className="mt-5 rounded-2xl bg-[var(--secondary-surface)] p-5"><p className="font-bold text-[var(--deep-navy)]">{title}</p><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">{body}</p></div>; }
function Pill({ children }: { children: string }) { return <span className="rounded-full bg-[var(--secondary-surface)] px-3 py-1 text-[var(--secondary-text)]">{children}</span>; }
function Urgency({ value }: { value: string }) { const urgent = ["urgent", "safety"].includes(value); return <span className={`rounded-full px-3 py-1 text-xs font-black ${urgent ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{labelize(value)}</span>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[var(--secondary-surface)] p-4"><dt className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted-text)]">{label}</dt><dd className="mt-2 break-words text-sm font-bold leading-6 text-[var(--deep-navy)]">{value || "Not provided"}</dd></div>; }
function DarkMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"><dt className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100">{label}</dt><dd className="mt-1 text-sm font-bold text-white">{value}</dd></div>; }
function labelize(value: string) { return (value || "Not provided").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()); }
function dateTime(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function dateOnly(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)); }
function relativeTime(value: string) { const diff = Date.now() - Date.parse(value); const hours = Math.max(1, Math.round(diff / 36e5)); return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`; }
function urgencyRank(value: string) { return value === "safety" ? 4 : value === "urgent" ? 3 : value === "normal" ? 2 : 1; }
function estimateTime(repair: TechnicianRepair) { return repair.diagnoses[0]?.estimated_duration || (repair.estimated_completion_at ? dateOnly(repair.estimated_completion_at) : "ETA not set"); }