import { notFound, redirect } from "next/navigation";
import { RepairExecutionHeader, RepairExecutionWorkspace, type ExecutionDiagnosis, type ExecutionEvent, type ExecutionItem, type ExecutionPart, type ExecutionPhoto, type ExecutionQuote, type ExecutionRepair, type ExecutionTime, type ExecutionWarranty, type ExecutionConfirmation, type ExecutionMessage, type ExecutionNotification, type ExecutionQuoteLineItem, type ExecutionReadiness } from "@/components/repairs/repair-execution-workspace";
import { createClient, getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

type RepairRow = Record<string, unknown> & ExecutionRepair & { profile_id: string; assigned_technician_profile_id: string | null };
type ProfileRow = { id: string; full_name: string | null; display_name: string | null; phone: string | null; city: string | null };
type ProgressPhotoRow = { id: string; phase: string | null; caption: string | null; storage_bucket: string; storage_path: string; created_at: string; signedUrl?: string | null };
type AttachmentRow = { id: string; file_name: string; content_type: string | null; storage_bucket: string; storage_path: string; created_at: string; signedUrl?: string | null };

async function safe<T>(query: PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  const { data, error } = await query;
  return error || !data ? fallback : data;
}

export async function generateMetadata({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return { title: `${reference} | Diagnosis Workspace | EC TECH HUB` };
}

export default async function Page({ params }: { params: Promise<{ reference: string }> }) {
  const user = await getCurrentUser();
  const { reference } = await params;
  if (!user) redirect(`/auth/sign-in?returnTo=/technician/jobs/${encodeURIComponent(reference)}`);
  const profile = await getCurrentProfile();
  if (profile?.role !== "technician" && profile?.role !== "administrator") redirect("/unauthorized");
  const supabase = await createClient();
  if (!supabase) notFound();

  const { data, error } = await supabase.from("repair_requests").select("*").eq("reference", reference).maybeSingle();
  if (error || !data) notFound();
  const repairRow = data as RepairRow;
  const assignedToMe = repairRow.assigned_technician_profile_id === profile.id || profile.role === "administrator";
  const unassigned = !repairRow.assigned_technician_profile_id;
  if (!assignedToMe && !unassigned) redirect("/unauthorized");

  const [customer, technician, diagnosisRows, events, quotes, quoteLineItems, messages, notifications, parts, progressPhotos, customerAttachments, inspections, checklist, tests, timeEntries, warrantyRows, confirmations, readinessRows] = await Promise.all([
    safe<ProfileRow | null>(supabase.from("profiles").select("id,full_name,display_name,phone,city").eq("id", repairRow.profile_id).maybeSingle(), null),
    repairRow.assigned_technician_profile_id ? safe<ProfileRow | null>(supabase.from("profiles").select("id,full_name,display_name,phone,city").eq("id", repairRow.assigned_technician_profile_id).maybeSingle(), null) : Promise.resolve(null),
    safe<ExecutionDiagnosis[]>(supabase.from("repair_diagnoses").select("id,summary,observed_faults,likely_cause,confirmed_cause,repair_recommendation,required_parts,estimated_duration,complexity,priority,public_notes,private_notes,submitted_at,created_at").eq("repair_request_id", repairRow.id).order("created_at", { ascending: false }), []),
    safe<ExecutionEvent[]>(supabase.from("repair_status_events").select("id,status,title,description,responsible_party,created_at").eq("repair_request_id", repairRow.id).order("created_at", { ascending: true }), []),
    safe<ExecutionQuote[]>(supabase.from("repair_quotes").select("id,version,status,labour_amount,parts_amount,service_fee_amount,additional_fees_amount,discount_amount,tax_amount,total_amount,currency,notes,estimated_completion_at,warranty_note,revision_reason,approved_at,declined_at,clarification_requested_at,clarification_message,created_at").eq("repair_request_id", repairRow.id).order("version", { ascending: false }), []),
    safe<ExecutionQuoteLineItem[]>(supabase.from("repair_quote_line_items").select("id,quote_id,item_type,description,quantity,unit_amount,total_amount,customer_visible").in("quote_id", []).limit(0), []),
    safe<ExecutionMessage[]>(supabase.from("repair_messages").select("id,sender_role,message,read_at,created_at").eq("repair_request_id", repairRow.id).order("created_at", { ascending: false }).limit(50), []),
    safe<ExecutionNotification[]>(supabase.from("repair_notifications").select("id,type,title,message,read_at,created_at").eq("repair_request_id", repairRow.id).eq("profile_id", repairRow.profile_id).order("created_at", { ascending: false }).limit(20), []),
    safe<ExecutionPart[]>(supabase.from("repair_parts").select("id,part_name,manufacturer,part_number,quantity,condition,supplier,warranty_note,unit_cost_amount,cost_amount,currency,availability,notes,installed_at,created_at").eq("repair_request_id", repairRow.id).order("created_at", { ascending: false }), []),
    safe<ProgressPhotoRow[]>(supabase.from("repair_progress_photos").select("id,phase,caption,storage_bucket,storage_path,created_at").eq("repair_request_id", repairRow.id).order("created_at", { ascending: false }), []),
    safe<AttachmentRow[]>(supabase.from("repair_request_attachments").select("id,file_name,content_type,storage_bucket,storage_path,created_at").eq("repair_request_id", repairRow.id).order("created_at", { ascending: false }), []),
    safe<ExecutionItem[]>(supabase.from("repair_inspection_items").select("id,item_key,label,result,notes,checked_at").eq("repair_request_id", repairRow.id), []),
    safe<ExecutionItem[]>(supabase.from("repair_execution_checklist_items").select("id,item_key,label,completed,notes,completed_at").eq("repair_request_id", repairRow.id), []),
    safe<ExecutionItem[]>(supabase.from("repair_testing_items").select("id,item_key,label,result,notes,tested_at").eq("repair_request_id", repairRow.id), []),
    safe<ExecutionTime[]>(supabase.from("repair_time_entries").select("id,category,minutes,notes,created_at").eq("repair_request_id", repairRow.id).order("created_at", { ascending: false }), []),
    safe<ExecutionWarranty[]>(supabase.from("repair_warranty_records").select("id,warranty_provided,duration,coverage,terms,serial_numbers,warranty_reference,updated_at").eq("repair_request_id", repairRow.id).limit(1), []),
    safe<ExecutionConfirmation[]>(supabase.from("repair_quality_confirmations").select("id,confirmation_text,confirmed_at").eq("repair_request_id", repairRow.id).order("confirmed_at", { ascending: false }), []),
    safe<ExecutionReadiness[]>(supabase.from("repair_collection_readiness").select("repair_complete,testing_passed,photos_uploaded,summary_generated,warranty_recorded,customer_notified,ready_marked_at").eq("repair_request_id", repairRow.id).limit(1), []),
  ]);

  const quoteIds = quotes.map((quote) => quote.id);
  const realLineItems = quoteIds.length ? await safe<ExecutionQuoteLineItem[]>(supabase.from("repair_quote_line_items").select("id,quote_id,item_type,description,quantity,unit_amount,total_amount,customer_visible").in("quote_id", quoteIds), []) : quoteLineItems;
  const quotesWithLineItems = quotes.map((quote) => ({ ...quote, lineItems: realLineItems.filter((item) => item.quote_id === quote.id) }));

  await Promise.all([...progressPhotos, ...customerAttachments].map(async (item) => {
    const { data: signed } = await supabase.storage.from(item.storage_bucket || "repair-attachments").createSignedUrl(item.storage_path, 60 * 10);
    item.signedUrl = signed?.signedUrl ?? null;
  }));

  const repair: ExecutionRepair = { ...repairRow, customer, technician };
  const photos: ExecutionPhoto[] = [
    ...customerAttachments.map((item) => ({ id: item.id, phase: "customer", caption: item.file_name, file_name: item.file_name, content_type: item.content_type, signedUrl: item.signedUrl ?? null, created_at: item.created_at })),
    ...progressPhotos.map((item) => ({ id: item.id, phase: item.phase, caption: item.caption, file_name: item.caption || `${item.phase || "repair"} evidence`, content_type: "image/*", signedUrl: item.signedUrl ?? null, created_at: item.created_at })),
  ];
  const messageEvents = messages.length ? [{ id: "message-presence", status: repair.status, title: "Customer communication exists", description: "Repair message records exist for this job.", responsible_party: "technician", created_at: repair.updated_at }] : [];
  const dataSet = { repair, diagnosis: diagnosisRows[0] ?? null, inspections, checklist, tests, parts, photos, timeEntries, warranty: warrantyRows[0] ?? null, quotes: quotesWithLineItems, events: [...events, ...messageEvents], confirmations, messages, notifications, readiness: readinessRows[0] ?? null };

  return <main id="main-content" className="bg-[var(--page-bg)]"><section className="container-grid py-8 sm:py-10 lg:py-12"><RepairExecutionHeader repair={repair} /><RepairExecutionWorkspace data={dataSet} /></section></main>;
}