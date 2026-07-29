"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export type TechnicianWorkflowState = { ok: boolean; message?: string; fieldErrors?: Record<string, string> };

const declineReasons = new Set(["Outside service area", "Unavailable", "Wrong specialization", "Capacity full", "Other"]);
const progressMap: Record<string, string> = {
  diagnosis_complete: "diagnosis_complete",
  parts_ordered: "waiting_for_parts",
  parts_received: "waiting_for_parts",
  repair_started: "repair_in_progress",
  waiting_for_parts: "waiting_for_parts",
  repair_continued: "repair_in_progress",
  testing: "testing",
  quality_check: "quality_check",
  ready_for_collection: "ready_for_collection",
  completed: "completed",
};

const inspectionLabels: Record<string, string> = {
  physical_damage: "Physical damage",
  liquid_damage: "Liquid damage",
  power: "Power",
  battery: "Battery",
  display: "Display",
  keyboard: "Keyboard",
  ports: "Ports",
  camera: "Camera",
  speakers: "Speakers",
  microphone: "Microphone",
  wifi: "Wi-Fi",
  bluetooth: "Bluetooth",
  storage: "Storage",
  memory: "Memory",
  motherboard: "Motherboard",
  accessories_received: "Accessories received",
};

const repairChecklistLabels: Record<string, string> = {
  device_inspected: "Device inspected",
  diagnosis_completed: "Diagnosis completed",
  customer_approved: "Customer approved",
  parts_installed: "Parts installed",
  firmware_updated: "Firmware updated",
  device_cleaned: "Device cleaned",
  stress_tested: "Stress tested",
  quality_checked: "Quality checked",
  customer_notified: "Customer notified",
};

const testingLabels: Record<string, string> = {
  powers_on: "Device powers on",
  display_working: "Display working",
  charging_working: "Charging working",
  keyboard_functional: "Keyboard functional",
  touchscreen_functional: "Touchscreen functional",
  wifi_connected: "Wi-Fi connected",
  bluetooth_working: "Bluetooth working",
  audio_verified: "Audio verified",
  camera_verified: "Camera verified",
  thermals_acceptable: "Thermals acceptable",
  performance_acceptable: "Performance acceptable",
  battery_health_acceptable: "Battery health acceptable",
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function amount(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : null;
}

function minutes(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

async function requireTechnician() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/sign-in?returnTo=/technician/jobs");
  if (profile.role !== "technician" && profile.role !== "administrator") redirect("/unauthorized");
  const supabase = await createClient();
  if (!supabase) return { profile, supabase: null, error: "Supabase is not available right now." };
  return { profile, supabase, error: null };
}

async function getRepairForTechnician(reference: string) {
  const ctx = await requireTechnician();
  if (!ctx.supabase) return { ...ctx, repair: null };
  const { data, error } = await ctx.supabase
    .from("repair_requests")
    .select("id,reference,profile_id,auth_user_id,status,assigned_technician_profile_id")
    .eq("reference", reference)
    .maybeSingle();
  if (error || !data) return { ...ctx, repair: null, error: "We could not find that repair request." };
  const repair = data as { id: string; reference: string; profile_id: string; auth_user_id: string; status: string; assigned_technician_profile_id: string | null };
  if (ctx.profile.role !== "administrator" && repair.assigned_technician_profile_id && repair.assigned_technician_profile_id !== ctx.profile.id) {
    return { ...ctx, repair: null, error: "This repair is assigned to another technician." };
  }
  return { ...ctx, repair };
}

async function addEvent(ctx: Awaited<ReturnType<typeof getRepairForTechnician>>, status: string, title: string, description: string, responsibleParty = "technician") {
  if (!ctx.supabase || !ctx.repair) return;
  await ctx.supabase.from("repair_status_events").insert({ repair_request_id: ctx.repair.id, status, title, description, responsible_party: responsibleParty, visibility: "customer", created_by_profile_id: ctx.profile.id });
}

async function assertAssigned(reference: string) {
  const ctx = await getRepairForTechnician(reference);
  if (!ctx.supabase || !ctx.repair) return { ...ctx, ok: false as const, message: ctx.error ?? "Unable to update this repair." };
  if (ctx.repair.assigned_technician_profile_id !== ctx.profile.id && ctx.profile.role !== "administrator") return { ...ctx, ok: false as const, message: "Accept or assign the job before updating execution details." };
  return { ...ctx, ok: true as const, message: undefined };
}

async function notifyCustomer(ctx: Awaited<ReturnType<typeof getRepairForTechnician>>, type: string, title: string, message: string) {
  if (!ctx.supabase || !ctx.repair) return;
  await ctx.supabase.from("repair_notifications").insert({ repair_request_id: ctx.repair.id, profile_id: ctx.repair.profile_id, type, title, message });
}

export async function acceptRepairJob(reference: string): Promise<TechnicianWorkflowState> {
  const ctx = await getRepairForTechnician(reference);
  if (!ctx.supabase || !ctx.repair) return { ok: false, message: ctx.error ?? "Unable to accept this repair." };
  if (ctx.profile.role !== "administrator" && ctx.repair.assigned_technician_profile_id) return { ok: false, message: "This repair has already been assigned." };
  if (!["submitted", "awaiting_assignment"].includes(ctx.repair.status)) return { ok: false, message: "This repair is no longer available for acceptance." };
  const now = new Date().toISOString();
  const { data: assigned, error } = await ctx.supabase.from("repair_requests").update({ assigned_technician_profile_id: ctx.profile.id, assignment_method: "technician_claim", assigned_at: now, status: "technician_assigned", updated_at: now }).eq("id", ctx.repair.id).is("assigned_technician_profile_id", null).in("status", ["submitted", "awaiting_assignment"]).select("id").maybeSingle();
  if (error || !assigned) return { ok: false, message: "We could not assign this repair to you. It may already be assigned." };
  await ctx.supabase.from("repair_assignment_attempts").insert({ repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, method: ctx.repair.assigned_technician_profile_id ? "manual_admin" : "technician_claim", decision: "accepted", decided_at: now });
  await addEvent(ctx, "technician_assigned", "Technician assigned", `${ctx.profile.display_name || ctx.profile.full_name || "A technician"} accepted this repair request.`);
  await notifyCustomer(ctx, "technician_assigned", "Technician assigned", `${ctx.profile.display_name || ctx.profile.full_name || "A technician"} has accepted your repair request. Diagnosis is the next step.`);
  revalidatePath("/technician/jobs");
  revalidatePath(`/technician/jobs/${reference}`);
  revalidatePath(`/repairs/${reference}`);
  return { ok: true, message: "Repair accepted. You can begin diagnosis." };
}

export async function startDiagnosis(reference: string): Promise<TechnicianWorkflowState> {
  const ctx = await assertAssigned(reference);
  if (!ctx.ok || !ctx.supabase || !ctx.repair) return { ok: false, message: ctx.message };
  const now = new Date().toISOString();
  const { error } = await ctx.supabase.from("repair_requests").update({ status: "diagnosis_started", updated_at: now }).eq("id", ctx.repair.id);
  if (error) return { ok: false, message: "Unable to start diagnosis." };
  await addEvent(ctx, "diagnosis_started", "Diagnosis started", "The technician began structured diagnosis and inspection.");
  revalidatePath(`/technician/jobs/${reference}`);
  return { ok: true, message: "Diagnosis started." };
}

export async function saveExecutionDiagnosis(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const summary = text(formData, "summary");
  const observedFaults = text(formData, "observedFaults");
  const existingId = text(formData, "diagnosisId");
  if (summary.length < 3 || observedFaults.length < 3) return { ok: false, message: "Add observed issues and a fault description before saving." };
  const ctx = await assertAssigned(reference);
  if (!ctx.ok || !ctx.supabase || !ctx.repair) return { ok: false, message: ctx.message };
  const payload = {
    repair_request_id: ctx.repair.id,
    technician_profile_id: ctx.profile.id,
    summary,
    observed_faults: observedFaults,
    likely_cause: text(formData, "likelyCause") || null,
    confirmed_cause: text(formData, "confirmedCause") || null,
    repair_recommendation: text(formData, "repairRecommendation") || null,
    required_parts: text(formData, "requiredParts") || null,
    estimated_duration: text(formData, "estimatedDuration") || null,
    complexity: text(formData, "complexity") || "moderate",
    priority: text(formData, "priority") || "normal",
    public_notes: text(formData, "publicNotes") || null,
    private_notes: text(formData, "privateNotes") || null,
    submitted: false,
    updated_at: new Date().toISOString(),
  };
  const { error } = existingId ? await ctx.supabase.from("repair_diagnoses").update(payload).eq("id", existingId) : await ctx.supabase.from("repair_diagnoses").insert(payload);
  if (error) return { ok: false, message: "Unable to save diagnosis details. Ensure migration 005 is applied." };
  await addEvent(ctx, ctx.repair.status === "diagnosis_started" ? "diagnosis_started" : ctx.repair.status, "Diagnosis documentation saved", "Technician updated structured diagnosis findings.");
  revalidatePath(`/technician/jobs/${reference}`);
  return { ok: true, message: "Diagnosis documentation saved." };
}

export async function saveInspectionItem(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const itemKey = text(formData, "itemKey");
  const result = text(formData, "result");
  if (!inspectionLabels[itemKey] || !["pass", "fail", "not_tested"].includes(result)) return { ok: false, message: "Choose a valid inspection item and result." };
  const ctx = await assertAssigned(reference);
  if (!ctx.ok || !ctx.supabase || !ctx.repair) return { ok: false, message: ctx.message };
  const now = new Date().toISOString();
  const { error } = await ctx.supabase.from("repair_inspection_items").upsert({ repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, item_key: itemKey, label: inspectionLabels[itemKey], result, notes: text(formData, "notes") || null, checked_at: now, updated_at: now }, { onConflict: "repair_request_id,item_key" });
  if (error) return { ok: false, message: "Unable to save inspection item. Ensure migration 005 is applied." };
  revalidatePath(`/technician/jobs/${reference}`);
  return { ok: true, message: `${inspectionLabels[itemKey]} saved.` };
}

export async function saveRepairChecklistItem(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const itemKey = text(formData, "itemKey");
  const completed = formData.get("completed") === "on";
  if (!repairChecklistLabels[itemKey]) return { ok: false, message: "Choose a valid checklist item." };
  const ctx = await assertAssigned(reference);
  if (!ctx.ok || !ctx.supabase || !ctx.repair) return { ok: false, message: ctx.message };
  const now = new Date().toISOString();
  const { error } = await ctx.supabase.from("repair_execution_checklist_items").upsert({ repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, item_key: itemKey, label: repairChecklistLabels[itemKey], completed, completed_at: completed ? now : null, notes: text(formData, "notes") || null, updated_at: now }, { onConflict: "repair_request_id,item_key" });
  if (error) return { ok: false, message: "Unable to update repair checklist. Ensure migration 005 is applied." };
  revalidatePath(`/technician/jobs/${reference}`);
  return { ok: true, message: `${repairChecklistLabels[itemKey]} updated.` };
}

export async function saveTestingItem(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const itemKey = text(formData, "itemKey");
  const result = text(formData, "result");
  if (!testingLabels[itemKey] || !["pass", "fail", "retest"].includes(result)) return { ok: false, message: "Choose a valid test and result." };
  const ctx = await assertAssigned(reference);
  if (!ctx.ok || !ctx.supabase || !ctx.repair) return { ok: false, message: ctx.message };
  const now = new Date().toISOString();
  const { error } = await ctx.supabase.from("repair_testing_items").upsert({ repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, item_key: itemKey, label: testingLabels[itemKey], result, notes: text(formData, "notes") || null, tested_at: now, updated_at: now }, { onConflict: "repair_request_id,item_key" });
  if (error) return { ok: false, message: "Unable to save testing result. Ensure migration 005 is applied." };
  revalidatePath(`/technician/jobs/${reference}`);
  return { ok: true, message: `${testingLabels[itemKey]} saved.` };
}

export async function addRepairPart(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const partName = text(formData, "partName");
  if (partName.length < 2) return { ok: false, message: "Enter a replacement part name." };
  const ctx = await assertAssigned(reference);
  if (!ctx.ok || !ctx.supabase || !ctx.repair) return { ok: false, message: ctx.message };
  const quantity = Math.max(1, minutes(formData, "quantity") || 1);
  const unitCost = amount(formData, "unitCost") ?? amount(formData, "cost");
  const insertPayload: Record<string, unknown> = { repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, part_name: partName, part_number: text(formData, "partNumber") || null, quantity, condition: text(formData, "condition") || "new", supplier: text(formData, "supplier") || null, warranty_note: text(formData, "warranty") || null, cost_amount: unitCost === null ? null : Number((unitCost * quantity).toFixed(2)), installed_at: text(formData, "installedAt") || null };
  const manufacturer = text(formData, "manufacturer");
  const availability = text(formData, "availability");
  const notes = text(formData, "notes");
  if (manufacturer) insertPayload.manufacturer = manufacturer;
  if (["available", "ordered", "backordered", "installed", "cancelled"].includes(availability)) insertPayload.availability = availability;
  if (unitCost !== null) insertPayload.unit_cost_amount = unitCost;
  if (notes) insertPayload.notes = notes;
  const { error } = await ctx.supabase.from("repair_parts").insert(insertPayload);
  if (error) return { ok: false, message: "Unable to save replacement part. Ensure migration 005 is applied." };
  revalidatePath(`/technician/jobs/${reference}`);
  return { ok: true, message: "Replacement part recorded." };
}

export async function addTimeEntry(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const category = text(formData, "category");
  const entryMinutes = minutes(formData, "minutes");
  if (!["diagnosis", "repair", "testing", "paused"].includes(category) || entryMinutes < 1) return { ok: false, message: "Choose a category and enter minutes." };
  const ctx = await assertAssigned(reference);
  if (!ctx.ok || !ctx.supabase || !ctx.repair) return { ok: false, message: ctx.message };
  const { error } = await ctx.supabase.from("repair_time_entries").insert({ repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, category, minutes: entryMinutes, notes: text(formData, "notes") || null });
  if (error) return { ok: false, message: "Unable to record time. Ensure migration 005 is applied." };
  revalidatePath(`/technician/jobs/${reference}`);
  return { ok: true, message: "Time entry recorded." };
}

export async function saveWarrantyRecord(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const ctx = await assertAssigned(reference);
  if (!ctx.ok || !ctx.supabase || !ctx.repair) return { ok: false, message: ctx.message };
  const now = new Date().toISOString();
  const { error } = await ctx.supabase.from("repair_warranty_records").upsert({ repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, warranty_provided: formData.get("warrantyProvided") === "on", duration: text(formData, "duration") || null, coverage: text(formData, "coverage") || null, terms: text(formData, "terms") || null, serial_numbers: text(formData, "serialNumbers") || null, warranty_reference: text(formData, "warrantyReference") || null, updated_at: now }, { onConflict: "repair_request_id" });
  if (error) return { ok: false, message: "Unable to save warranty record. Ensure migration 005 is applied." };
  revalidatePath(`/technician/jobs/${reference}`);
  return { ok: true, message: "Warranty record saved." };
}

export async function confirmQualityAndComplete(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const confirmed = formData.get("qualityConfirmation") === "on";
  if (!confirmed) return { ok: false, message: "Confirm that all required repair procedures have been completed." };
  const ctx = await assertAssigned(reference);
  if (!ctx.ok || !ctx.supabase || !ctx.repair) return { ok: false, message: ctx.message };
  const now = new Date().toISOString();
  await ctx.supabase.from("repair_quality_confirmations").insert({ repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, confirmation_text: "I confirm that all required repair procedures have been completed.", confirmed_at: now });
  const { error } = await ctx.supabase.from("repair_requests").update({ status: "completed", completed_at: now, updated_at: now }).eq("id", ctx.repair.id);
  if (error) return { ok: false, message: "Unable to complete repair." };
  await addEvent(ctx, "completed", "Repair completed", "Technician completed final quality confirmation and marked the repair complete.");
  await notifyCustomer(ctx, "repair_completed", "Repair completed", "Your repair has been completed and is ready for handover guidance from the technician.");
  revalidatePath(`/technician/jobs/${reference}`);
  revalidatePath(`/repairs/${reference}`);
  return { ok: true, message: "Repair completed with quality confirmation." };
}

export async function declineRepairJob(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const reason = text(formData, "reason");
  const note = text(formData, "note");
  if (!declineReasons.has(reason)) return { ok: false, message: "Choose a valid decline reason." };
  const ctx = await getRepairForTechnician(reference);
  if (!ctx.supabase || !ctx.repair) return { ok: false, message: ctx.error ?? "Unable to decline this repair." };
  const now = new Date().toISOString();
  await ctx.supabase.from("repair_assignment_attempts").insert({ repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, method: "technician_claim", decision: "declined", decline_reason: reason, decision_note: note || null, decided_at: now });
  if (ctx.repair.assigned_technician_profile_id === ctx.profile.id) {
    await ctx.supabase.from("repair_requests").update({ assigned_technician_profile_id: null, status: "awaiting_assignment", updated_at: now }).eq("id", ctx.repair.id);
  }
  await notifyCustomer(ctx, "system", "We are still looking for a technician", "A technician was unable to accept the request. EC TECH HUB will continue matching the repair with suitable support.");
  revalidatePath("/technician/jobs");
  revalidatePath(`/repairs/${reference}`);
  return { ok: true, message: "Repair declined with a reason. The request can be matched again." };
}

export async function requestMoreInformation(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const message = text(formData, "message");
  if (message.length < 10) return { ok: false, message: "Add a clear question for the customer." };
  const ctx = await getRepairForTechnician(reference);
  if (!ctx.supabase || !ctx.repair) return { ok: false, message: ctx.error ?? "Unable to request more information." };
  await ctx.supabase.from("repair_assignment_attempts").insert({ repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, method: "technician_claim", decision: "requested_more_information", decision_note: message, decided_at: new Date().toISOString() });
  await ctx.supabase.from("repair_messages").insert({ repair_request_id: ctx.repair.id, sender_profile_id: ctx.profile.id, sender_role: "technician", message });
  await notifyCustomer(ctx, "message", "Technician requested more information", message);
  revalidatePath(`/technician/jobs/${reference}`);
  revalidatePath(`/repairs/${reference}`);
  return { ok: true, message: "Information request sent to the customer." };
}

export async function submitDiagnosis(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const summary = text(formData, "summary");
  const observedFaults = text(formData, "observedFaults");
  if (summary.length < 12 || observedFaults.length < 12) return { ok: false, message: "Add a diagnosis summary and observed faults before submitting." };
  const ctx = await getRepairForTechnician(reference);
  if (!ctx.supabase || !ctx.repair) return { ok: false, message: ctx.error ?? "Unable to submit diagnosis." };
  if (ctx.repair.assigned_technician_profile_id !== ctx.profile.id && ctx.profile.role !== "administrator") return { ok: false, message: "Accept or assign the job before submitting diagnosis." };
  const now = new Date().toISOString();
  const { error } = await ctx.supabase.from("repair_diagnoses").insert({ repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, summary, observed_faults: observedFaults, required_parts: text(formData, "requiredParts") || null, estimated_duration: text(formData, "estimatedDuration") || null, complexity: text(formData, "complexity") || "moderate", priority: text(formData, "priority") || "normal", public_notes: text(formData, "publicNotes") || null, private_notes: text(formData, "privateNotes") || null, submitted: true, submitted_at: now });
  if (error) return { ok: false, message: "We could not save the diagnosis. Please check the fields and try again." };
  await ctx.supabase.from("repair_requests").update({ status: "diagnosis_complete", diagnosis_submitted_at: now, updated_at: now }).eq("id", ctx.repair.id);
  await addEvent(ctx, "diagnosis_complete", "Diagnosis complete", "The technician submitted a diagnosis summary and the repair can move to quotation.");
  await ctx.supabase.from("repair_updates").insert({ repair_request_id: ctx.repair.id, author_profile_id: ctx.profile.id, author_role: "technician", title: "Diagnosis complete", message: text(formData, "publicNotes") || summary, is_public: true });
  await notifyCustomer(ctx, "status_changed", "Diagnosis complete", "Your technician has completed the diagnosis. A quotation may be prepared next.");
  revalidatePath(`/technician/jobs/${reference}`);
  revalidatePath(`/repairs/${reference}`);
  return { ok: true, message: "Diagnosis submitted." };
}

export async function sendQuotation(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const labour = amount(formData, "labour");
  const parts = amount(formData, "parts");
  const serviceFee = amount(formData, "serviceFee");
  const collectionFee = amount(formData, "collectionFee");
  const deliveryFee = amount(formData, "deliveryFee");
  const additional = amount(formData, "additional");
  const discount = amount(formData, "discount") ?? 0;
  const tax = amount(formData, "tax") ?? 0;
  const currency = text(formData, "currency") || "ZAR";
  if (labour === null && parts === null && serviceFee === null && collectionFee === null && deliveryFee === null && additional === null) return { ok: false, message: "Add at least one quotation amount." };
  const ctx = await getRepairForTechnician(reference);
  if (!ctx.supabase || !ctx.repair) return { ok: false, message: ctx.error ?? "Unable to send quotation." };
  if (ctx.repair.assigned_technician_profile_id !== ctx.profile.id && ctx.profile.role !== "administrator") return { ok: false, message: "Only the assigned technician can send a quotation." };
  const previousQuotes = await ctx.supabase.from("repair_quotes").select("id,version").eq("repair_request_id", ctx.repair.id).order("version", { ascending: false }).limit(1);
  const previous = previousQuotes.data?.[0] as { id: string; version: number } | undefined;
  const version = previous ? Number(previous.version) + 1 : 1;
  const total = Number(labour || 0) + Number(parts || 0) + Number(serviceFee || 0) + Number(collectionFee || 0) + Number(deliveryFee || 0) + Number(additional || 0) + tax - discount;
  if (total < 0) return { ok: false, message: "The quotation total cannot be negative." };
  const now = new Date().toISOString();
  const revisionReason = previous ? text(formData, "revisionReason") : "Initial quotation";
  const insertPayload: Record<string, unknown> = { repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, labour_amount: labour, parts_amount: parts, service_fee_amount: serviceFee, additional_fees_amount: Number(collectionFee || 0) + Number(deliveryFee || 0) + Number(additional || 0) || null, discount_amount: discount || null, tax_amount: tax || null, total_amount: Number(total.toFixed(2)), currency, status: "awaiting_approval", notes: text(formData, "notes") || null, estimated_completion_at: text(formData, "estimatedCompletion") || null, warranty_note: text(formData, "warranty") || null, version, supersedes_quote_id: previous?.id ?? null, created_by_profile_id: ctx.profile.id };
  if (revisionReason) insertPayload.revision_reason = revisionReason;
  const { data: quote, error } = await ctx.supabase.from("repair_quotes").insert(insertPayload).select("id").single();
  if (error || !quote) return { ok: false, message: "We could not send the quotation. Please try again." };
  const lineItems = [
    ["labour", "Labour", labour], ["part", "Replacement parts", parts], ["service_fee", "Diagnostic fee", serviceFee], ["additional", "Collection fee", collectionFee], ["additional", "Delivery fee", deliveryFee], ["additional", "Additional costs", additional], ["discount", "Discount", discount ? -discount : null], ["tax", "Tax", tax || null],
  ].filter(([, , value]) => value !== null && value !== undefined && Number(value) !== 0).map(([itemType, description, value]) => ({ quote_id: quote.id, item_type: itemType, description, quantity: 1, unit_amount: Number(value), total_amount: Number(value) }));
  if (lineItems.length) await ctx.supabase.from("repair_quote_line_items").insert(lineItems);
  await ctx.supabase.from("repair_requests").update({ status: "quotation_sent", quotation_sent_at: now, estimated_completion_at: text(formData, "estimatedCompletion") || null, updated_at: now }).eq("id", ctx.repair.id);
  await addEvent(ctx, "quotation_sent", `Quotation v${version} sent`, "A structured quotation is ready for customer review.");
  await notifyCustomer(ctx, "quote_available", "Quote available", "Review the quotation and approve, decline, or ask for clarification.");
  revalidatePath(`/technician/jobs/${reference}`);
  revalidatePath(`/repairs/${reference}`);
  return { ok: true, message: `Quotation v${version} sent for customer approval.` };
}

export async function updateRepairProgress(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const stage = text(formData, "stage");
  const description = text(formData, "description");
  if (!progressMap[stage]) return { ok: false, message: "Choose a valid repair progress stage." };
  if (description.length < 8) return { ok: false, message: "Add a short progress description." };
  const ctx = await getRepairForTechnician(reference);
  if (!ctx.supabase || !ctx.repair) return { ok: false, message: ctx.error ?? "Unable to update progress." };
  const status = progressMap[stage];
  const now = new Date().toISOString();
  const payload: Record<string, string> = { status, updated_at: now };
  if (stage === "repair_started") payload.repair_started_at = now;
  if (stage === "completed") payload.completed_at = now;
  await ctx.supabase.from("repair_requests").update(payload).eq("id", ctx.repair.id);
  await addEvent(ctx, status, label(stage), description);
  await ctx.supabase.from("repair_updates").insert({ repair_request_id: ctx.repair.id, author_profile_id: ctx.profile.id, author_role: "technician", title: label(stage), message: description, is_public: true });
  await notifyCustomer(ctx, stage === "completed" ? "repair_completed" : "status_changed", label(stage), description);
  revalidatePath(`/technician/jobs/${reference}`);
  revalidatePath(`/repairs/${reference}`);
  return { ok: true, message: "Repair progress updated." };
}

export async function sendRepairMessage(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const message = text(formData, "message");
  if (message.length < 2) return { ok: false, message: "Write a message before sending." };
  const ctx = await getRepairForTechnician(reference);
  if (!ctx.supabase || !ctx.repair) return { ok: false, message: ctx.error ?? "Unable to send message." };
  await ctx.supabase.from("repair_messages").insert({ repair_request_id: ctx.repair.id, sender_profile_id: ctx.profile.id, sender_role: "technician", message });
  await notifyCustomer(ctx, "message", "New technician message", message.length > 120 ? `${message.slice(0, 117)}...` : message);
  revalidatePath(`/technician/jobs/${reference}`);
  revalidatePath(`/repairs/${reference}`);
  return { ok: true, message: "Message sent." };
}

export async function reportRepairDelay(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const reason = text(formData, "delayReason");
  const details = text(formData, "delayDetails");
  const reasons = new Set(["Waiting for parts", "Customer unavailable", "Additional diagnosis", "Supplier delay", "Other"]);
  if (!reasons.has(reason)) return { ok: false, message: "Choose a valid delay reason." };
  if (details.length < 10) return { ok: false, message: "Explain the delay clearly for the customer." };
  const ctx = await assertAssigned(reference);
  if (!ctx.ok || !ctx.supabase || !ctx.repair) return { ok: false, message: ctx.message };
  const now = new Date().toISOString();
  await ctx.supabase.from("repair_requests").update({ status: "waiting_for_parts", updated_at: now }).eq("id", ctx.repair.id);
  await addEvent(ctx, "waiting_for_parts", `Repair delayed: ${reason}`, details);
  await ctx.supabase.from("repair_updates").insert({ repair_request_id: ctx.repair.id, author_profile_id: ctx.profile.id, author_role: "technician", title: `Repair delayed: ${reason}`, message: details, is_public: true });
  await notifyCustomer(ctx, "repair_delayed", `Repair delayed: ${reason}`, details);
  revalidatePath(`/technician/jobs/${reference}`);
  revalidatePath(`/repairs/${reference}`);
  return { ok: true, message: "Delay recorded and customer notification queued." };
}

export async function markReadyForCollection(_previous: TechnicianWorkflowState, formData: FormData): Promise<TechnicianWorkflowState> {
  const reference = text(formData, "reference");
  const required = ["repairComplete", "testingPassed", "photosUploaded", "summaryGenerated", "warrantyRecorded", "customerNotified"];
  if (!required.every((key) => formData.get(key) === "on")) return { ok: false, message: "Complete every collection-readiness requirement before marking the device ready." };
  const ctx = await assertAssigned(reference);
  if (!ctx.ok || !ctx.supabase || !ctx.repair) return { ok: false, message: ctx.message };
  const now = new Date().toISOString();
  const { error: readinessError } = await ctx.supabase.from("repair_collection_readiness").upsert({ repair_request_id: ctx.repair.id, technician_profile_id: ctx.profile.id, repair_complete: true, testing_passed: true, photos_uploaded: true, summary_generated: true, warranty_recorded: true, customer_notified: true, ready_marked_at: now, updated_at: now }, { onConflict: "repair_request_id" });
  if (readinessError) return { ok: false, message: "Unable to save collection readiness. Ensure migration 006 is applied." };
  const { error } = await ctx.supabase.from("repair_requests").update({ status: "ready_for_collection", updated_at: now }).eq("id", ctx.repair.id);
  if (error) return { ok: false, message: "Unable to mark this repair ready for collection." };
  await addEvent(ctx, "ready_for_collection", "Ready for collection", "The repair passed collection readiness checks and the customer can arrange handover.");
  await notifyCustomer(ctx, "collection_ready", "Device ready for collection", "Your device has passed repair readiness checks and is ready for collection or handover.");
  revalidatePath(`/technician/jobs/${reference}`);
  revalidatePath(`/repairs/${reference}`);
  return { ok: true, message: "Repair marked ready for collection." };
}

function label(value: string) {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}