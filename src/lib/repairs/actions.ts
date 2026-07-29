"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { deviceCategories, servicePreferences, urgencyOptions, type RepairActionState, type RepairAttachmentInput, type RepairDraft, type SubmitRepairInput } from "./types";

type ProfileRow = { id: string; auth_user_id: string; email: string | null; full_name: string | null; role: string | null };

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validOption(value: string, options: readonly string[]) {
  return options.includes(value);
}

async function getSignedInProfile(): Promise<{ error?: RepairActionState; profile?: ProfileRow }> {
  if (!hasSupabaseEnv()) return { error: { ok: false, message: "Supabase is not configured. Add the environment variables before submitting repair requests." } };
  const supabase = await createClient();
  if (!supabase) return { error: { ok: false, message: "Supabase is not available right now. Please try again." } };
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: { ok: false, message: "Sign in to save and submit a repair request.", redirectTo: "/auth/sign-in?returnTo=/repairs/new" } };
  const { data, error } = await supabase.from("profiles").select("id,auth_user_id,email,full_name,role").eq("auth_user_id", user.id).maybeSingle();
  if (error) return { error: { ok: false, message: "We could not load your profile. Please try again." } };
  if (data) return { profile: data as ProfileRow };
  const { data: inserted, error: insertError } = await supabase.from("profiles").insert({ auth_user_id: user.id, email: user.email, full_name: user.user_metadata?.full_name ?? null, role: "customer", onboarding_status: "incomplete" }).select("id,auth_user_id,email,full_name,role").single();
  if (insertError || !inserted) return { error: { ok: false, message: "We could not create your platform profile. Please try again." } };
  return { profile: inserted as ProfileRow };
}

export async function loadRepairDraft(): Promise<{ draft: RepairDraft | null; currentStep: number; profileId?: string }> {
  const resolved = await getSignedInProfile();
  if (!resolved.profile) return { draft: null, currentStep: 1 };
  const supabase = await createClient();
  if (!supabase) return { draft: null, currentStep: 1, profileId: resolved.profile.id };
  const { data } = await supabase.from("repair_request_drafts").select("draft_data,current_step").eq("profile_id", resolved.profile.id).maybeSingle();
  return { draft: (data?.draft_data as RepairDraft | undefined) ?? null, currentStep: Number(data?.current_step || 1), profileId: resolved.profile.id };
}

export async function saveRepairDraft(input: { currentStep: number; draft: RepairDraft }): Promise<RepairActionState> {
  const resolved = await getSignedInProfile();
  if (!resolved.profile) return resolved.error ?? { ok: false, message: "Sign in to save your request." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Supabase is not available right now." };
  const { error } = await supabase.from("repair_request_drafts").upsert({ profile_id: resolved.profile.id, current_step: Math.min(Math.max(input.currentStep, 1), 5), draft_data: input.draft, updated_at: new Date().toISOString() }, { onConflict: "profile_id" });
  if (error) return { ok: false, message: "We could not save your draft. Your browser will keep the current fields while you continue." };
  return { ok: true, message: "Draft saved." };
}

function validateSubmit(input: SubmitRepairInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const allowedUrgencies = urgencyOptions.map((item) => item.value);
  const allowedServices = servicePreferences.map((item) => item.value);
  if (!validOption(text(input.deviceCategory), deviceCategories)) errors.deviceCategory = "Choose a device category.";
  if (text(input.brand).length < 2) errors.brand = "Enter the device brand.";
  if (text(input.model).length < 1) errors.model = "Enter the device model or type Unknown.";
  if (!text(input.approximateAge)) errors.approximateAge = "Choose the approximate age.";
  if (text(input.problemTitle).length < 6) errors.problemTitle = "Add a short problem title.";
  if (text(input.problemDescription).length < 30) errors.problemDescription = "Describe the issue in at least 30 characters.";
  if (!input.symptoms?.length) errors.symptoms = "Select at least one symptom.";
  if (!text(input.startedWhen)) errors.startedWhen = "Tell us when the problem started.";
  if (!validOption(text(input.urgency), allowedUrgencies)) errors.urgency = "Choose the urgency.";
  if (!text(input.province)) errors.province = "Enter your province.";
  if (!text(input.city)) errors.city = "Enter your city.";
  if (!text(input.area)) errors.area = "Enter your area.";
  if (!validOption(text(input.servicePreference), allowedServices)) errors.servicePreference = "Choose a preferred service option.";
  if (!input.confirmationAccepted) errors.confirmationAccepted = "Confirm that the information is accurate.";
  return errors;
}

export async function submitRepairRequest(input: SubmitRepairInput): Promise<RepairActionState> {
  const resolved = await getSignedInProfile();
  if (!resolved.profile) return resolved.error ?? { ok: false, message: "Sign in to submit your request." };
  const fieldErrors = validateSubmit(input);
  if (Object.keys(fieldErrors).length) return { ok: false, message: "Check the highlighted fields before submitting.", fieldErrors };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Supabase is not available right now." };

  const { data, error } = await supabase.from("repair_requests").insert({
    profile_id: resolved.profile.id,
    auth_user_id: resolved.profile.auth_user_id,
    device_category: text(input.deviceCategory),
    brand: text(input.brand),
    model: text(input.model),
    approximate_age: text(input.approximateAge),
    warranty_status: text(input.warrantyStatus) || null,
    purchase_date: text(input.purchaseDate) || null,
    problem_title: text(input.problemTitle),
    problem_description: text(input.problemDescription),
    symptoms: input.symptoms?.join(", ") ?? "",
    started_when: text(input.startedWhen),
    repaired_before: input.repairedBefore === "yes",
    urgency: text(input.urgency),
    province: text(input.province),
    city: text(input.city),
    area: text(input.area),
    service_preference: text(input.servicePreference),
    location_notes: text(input.locationNotes) || null,
    confirmation_accepted: true,
  }).select("id,reference").single();
  if (error || !data) return { ok: false, message: "We could not submit your repair request. Please check your connection and try again." };

  const attachments = input.attachments ?? [];
  if (attachments.length) {
    const rows = attachments.map((file) => ({ repair_request_id: data.id, profile_id: resolved.profile!.id, storage_path: file.storagePath, file_name: file.fileName, content_type: file.contentType, file_size_bytes: file.fileSizeBytes }));
    await supabase.from("repair_request_attachments").insert(rows);
  }
  await supabase.from("repair_request_drafts").delete().eq("profile_id", resolved.profile.id);
  revalidatePath("/dashboard");
  revalidatePath(`/repairs/${data.reference}`);
  return { ok: true, message: "Repair request submitted.", reference: data.reference, repairId: data.id, redirectTo: `/repairs/${data.reference}` };
}

async function getOwnedRepair(reference: string) {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, repair: null, error: "Supabase is not available right now." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, repair: null, error: "Sign in to manage this repair." };
  const { data, error } = await supabase
    .from("repair_requests")
    .select("id,reference,profile_id,auth_user_id,status")
    .eq("reference", reference)
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (error || !data) return { supabase, repair: null, error: "We could not find a repair request you can manage." };
  return { supabase, repair: data as { id: string; reference: string; profile_id: string; auth_user_id: string; status: string }, error: null };
}

export async function addRepairAttachments(input: { reference: string; attachments: RepairAttachmentInput[] }): Promise<RepairActionState> {
  const resolved = await getOwnedRepair(input.reference);
  if (!resolved.supabase || !resolved.repair) return { ok: false, message: resolved.error ?? "We could not add attachments." };
  const attachments = input.attachments.filter((file) => file.storagePath && file.fileName && file.contentType && file.fileSizeBytes > 0);
  if (!attachments.length) return { ok: false, message: "Choose at least one valid file before uploading." };
  const editableStatuses = ["submitted", "awaiting_assignment", "technician_assigned", "diagnosis_started", "waiting_for_customer_approval", "waiting_for_parts", "repairing", "repair_in_progress", "accepted", "reviewing", "in_progress"];
  if (!editableStatuses.includes(resolved.repair.status)) return { ok: false, message: "Additional uploads are not available for this repair status." };
  const rows = attachments.map((file) => ({ repair_request_id: resolved.repair!.id, profile_id: resolved.repair!.profile_id, storage_path: file.storagePath, file_name: file.fileName, content_type: file.contentType, file_size_bytes: file.fileSizeBytes }));
  const { error } = await resolved.supabase.from("repair_request_attachments").insert(rows);
  if (error) return { ok: false, message: "We could not save the uploaded file details. Please try again." };
  await resolved.supabase.from("repair_updates").insert({ repair_request_id: resolved.repair.id, author_role: "customer", title: "Additional information uploaded", message: `${attachments.length} attachment${attachments.length === 1 ? "" : "s"} added by the customer.`, is_public: true });
  revalidatePath(`/repairs/${resolved.repair.reference}`);
  return { ok: true, message: "Additional files uploaded." };
}

export async function cancelRepairRequest(reference: string): Promise<RepairActionState> {
  const resolved = await getOwnedRepair(reference);
  if (!resolved.supabase || !resolved.repair) return { ok: false, message: resolved.error ?? "We could not cancel this repair." };
  const cancellable = ["submitted", "awaiting_assignment", "technician_assigned", "reviewing", "accepted"];
  if (!cancellable.includes(resolved.repair.status)) return { ok: false, message: "This repair cannot be cancelled from the customer workspace at its current stage." };
  const { error } = await resolved.supabase.from("repair_requests").update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", resolved.repair.id);
  if (error) return { ok: false, message: "We could not cancel this repair right now." };
  await resolved.supabase.from("repair_status_events").insert({ repair_request_id: resolved.repair.id, status: "cancelled", title: "Repair cancelled", description: "The customer cancelled this repair request.", responsible_party: "customer", visibility: "customer" });
  revalidatePath(`/repairs/${resolved.repair.reference}`);
  return { ok: true, message: "Repair request cancelled." };
}

export async function decideRepairQuote(input: { reference: string; quoteId: string; decision: "approved" | "declined" | "clarification_requested"; note?: string }): Promise<RepairActionState> {
  const resolved = await getOwnedRepair(input.reference);
  if (!resolved.supabase || !resolved.repair) return { ok: false, message: resolved.error ?? "We could not update the quote." };
  const now = new Date().toISOString();
  const note = text(input.note);
  if (input.decision === "clarification_requested" && note.length < 8) return { ok: false, message: "Add a short clarification question before sending." };
  const payload = input.decision === "approved" ? { status: "approved", approved_at: now, updated_at: now, customer_decision_note: note || null } : input.decision === "declined" ? { status: "declined", declined_at: now, updated_at: now, customer_decision_note: note || null } : { status: "awaiting_approval", clarification_requested_at: now, clarification_message: note, updated_at: now };
  const { data: updatedQuote, error } = await resolved.supabase.from("repair_quotes").update(payload).eq("id", input.quoteId).eq("repair_request_id", resolved.repair.id).eq("status", "awaiting_approval").select("id").maybeSingle();
  if (error || !updatedQuote) return { ok: false, message: "This quotation is no longer awaiting a decision. Refresh and try again." };
  const status = input.decision === "approved" ? "repair_in_progress" : input.decision === "declined" ? "quotation_rejected" : "waiting_for_customer_approval";
  await resolved.supabase.from("repair_requests").update({ status, updated_at: now, repair_started_at: input.decision === "approved" ? now : undefined }).eq("id", resolved.repair.id);
  const title = input.decision === "approved" ? "Quote approved" : input.decision === "declined" ? "Quote declined" : "Clarification requested";
  const description = input.decision === "approved" ? "The customer approved the repair quotation." : input.decision === "declined" ? "The customer declined the repair quotation." : `The customer requested clarification: ${note}`;
  await resolved.supabase.from("repair_status_events").insert({ repair_request_id: resolved.repair.id, status, title, description, responsible_party: "customer", visibility: "customer" });
  revalidatePath(`/repairs/${resolved.repair.reference}`);
  revalidatePath(`/technician/jobs/${resolved.repair.reference}`);
  return { ok: true, message: input.decision === "approved" ? "Quote approved." : input.decision === "declined" ? "Quote declined." : "Clarification request sent." };
}

export async function confirmRepairCollection(reference: string): Promise<RepairActionState> {
  const resolved = await getOwnedRepair(reference);
  if (!resolved.supabase || !resolved.repair) return { ok: false, message: resolved.error ?? "We could not confirm this repair." };
  if (!(["ready_for_collection", "completed"] as string[]).includes(resolved.repair.status)) return { ok: false, message: "Completion confirmation is only available once the repair is ready or completed." };
  const now = new Date().toISOString();
  const { error } = await resolved.supabase.from("repair_requests").update({ status: "completed", customer_confirmed_at: now, completed_at: now, updated_at: now }).eq("id", resolved.repair.id);
  if (error) return { ok: false, message: "We could not confirm completion right now." };
  await resolved.supabase.from("repair_status_events").insert({ repair_request_id: resolved.repair.id, status: "completed", title: "Completion confirmed", description: "The customer confirmed collection or completion.", responsible_party: "customer", visibility: "customer" });
  revalidatePath(`/repairs/${resolved.repair.reference}`);
  return { ok: true, message: "Repair completion confirmed." };
}