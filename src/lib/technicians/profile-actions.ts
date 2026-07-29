"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export type TechnicianProfileActionState = { ok: boolean; message?: string };

const path = "/technician/profile";

function text(formData: FormData, key: string, max = 2000) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function intValue(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : null;
}

async function context() {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "technician" && profile.role !== "administrator")) return { ok: false as const, message: "Only technicians can manage this profile." };
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, message: "Supabase is not configured." };
  const { data: technician, error } = await supabase.from("technician_profiles").select("id,profile_id").eq("profile_id", profile.id).maybeSingle();
  if (error) return { ok: false as const, message: "Technician profile could not be loaded." };
  if (technician) return { ok: true as const, supabase, profile, technician: technician as { id: string; profile_id: string } };
  const { data: created, error: createError } = await supabase.from("technician_profiles").insert({ profile_id: profile.id, verification_status: "not_started" }).select("id,profile_id").single();
  if (createError || !created) return { ok: false as const, message: "Technician profile could not be created." };
  return { ok: true as const, supabase, profile, technician: created as { id: string; profile_id: string } };
}

export async function saveProfessionalProfile(_previous: TechnicianProfileActionState, formData: FormData): Promise<TechnicianProfileActionState> {
  const ctx = await context();
  if (!ctx.ok) return { ok: false, message: ctx.message };
  const fullName = text(formData, "fullName", 120);
  const displayName = text(formData, "displayName", 80);
  const phone = text(formData, "phone", 40);
  const province = text(formData, "province", 80);
  const city = text(formData, "city", 80);
  const biography = text(formData, "biography", 1200);
  if (biography.length > 1200) return { ok: false, message: "Biography must be 1,200 characters or fewer." };
  const { error: profileError } = await ctx.supabase.from("profiles").update({ full_name: fullName || null, display_name: displayName || null, phone: phone || null, province: province || null, city: city || null, updated_at: new Date().toISOString() }).eq("id", ctx.profile.id);
  if (profileError) return { ok: false, message: "Basic profile details could not be saved." };
  const { error } = await ctx.supabase.from("technician_profiles").update({ professional_title: text(formData, "professionalTitle", 120) || null, headline: text(formData, "headline", 180) || null, biography: biography || null, years_experience: intValue(formData, "yearsExperience"), languages: text(formData, "languages", 300) || null, education: text(formData, "education", 500) || null, memberships: text(formData, "memberships", 500) || null, service_area: [province, city].filter(Boolean).join(", ") || null, updated_at: new Date().toISOString() }).eq("id", ctx.technician.id);
  if (error) return { ok: false, message: "Professional profile could not be saved. Apply migration 007 if new fields are missing." };
  revalidatePath(path);
  return { ok: true, message: "Professional profile saved." };
}

export async function saveAvailabilityAndPrivacy(_previous: TechnicianProfileActionState, formData: FormData): Promise<TechnicianProfileActionState> {
  const ctx = await context();
  if (!ctx.ok) return { ok: false, message: ctx.message };
  const availability = text(formData, "availabilityStatus");
  if (!["available", "busy", "vacation", "temporarily_unavailable"].includes(availability)) return { ok: false, message: "Choose a valid availability status." };
  const { error } = await ctx.supabase.from("technician_profiles").update({ availability_status: availability, accepting_urgent_repairs: formData.get("acceptingUrgentRepairs") === "on", expected_response_time: text(formData, "expectedResponseTime", 80) || null, show_phone: formData.get("showPhone") === "on", show_email: formData.get("showEmail") === "on", show_business_address: formData.get("showBusinessAddress") === "on", show_portfolio: formData.get("showPortfolio") === "on", show_availability: formData.get("showAvailability") === "on", public_slug: text(formData, "publicSlug", 80) || null, updated_at: new Date().toISOString() }).eq("id", ctx.technician.id);
  if (error) return { ok: false, message: "Availability and privacy settings could not be saved." };
  revalidatePath(path);
  return { ok: true, message: "Availability and privacy settings saved." };
}

export async function addSkill(_previous: TechnicianProfileActionState, formData: FormData): Promise<TechnicianProfileActionState> {
  const ctx = await context();
  if (!ctx.ok) return { ok: false, message: ctx.message };
  const skillName = text(formData, "skillName", 100);
  if (skillName.length < 2) return { ok: false, message: "Enter a skill name." };
  const { error } = await ctx.supabase.from("technician_skills").upsert({ technician_profile_id: ctx.technician.id, skill_name: skillName, experience_level: text(formData, "experienceLevel") || "intermediate", years_experience: intValue(formData, "skillYears"), updated_at: new Date().toISOString() }, { onConflict: "technician_profile_id,skill_name" });
  if (error) return { ok: false, message: "Skill could not be saved." };
  revalidatePath(path);
  return { ok: true, message: "Skill saved." };
}

export async function addCertification(_previous: TechnicianProfileActionState, formData: FormData): Promise<TechnicianProfileActionState> {
  const ctx = await context();
  if (!ctx.ok) return { ok: false, message: ctx.message };
  const name = text(formData, "certificationName", 160);
  const org = text(formData, "issuingOrganization", 160);
  if (!name || !org) return { ok: false, message: "Certification name and issuer are required." };
  const { error } = await ctx.supabase.from("technician_certifications").insert({ technician_profile_id: ctx.technician.id, certification_name: name, issuing_organization: org, issue_date: text(formData, "issueDate") || null, expiry_date: text(formData, "expiryDate") || null, credential_id: text(formData, "credentialId", 120) || null, verification_status: "submitted" });
  if (error) return { ok: false, message: "Certification could not be saved." };
  revalidatePath(path);
  return { ok: true, message: "Certification submitted. It remains unverified until reviewed." };
}

export async function addPortfolioItem(_previous: TechnicianProfileActionState, formData: FormData): Promise<TechnicianProfileActionState> {
  const ctx = await context();
  if (!ctx.ok) return { ok: false, message: ctx.message };
  if (formData.get("consentConfirmed") !== "on") return { ok: false, message: "Confirm that no customer is identifiable without consent." };
  const title = text(formData, "title", 140);
  if (!title) return { ok: false, message: "Portfolio title is required." };
  const { error } = await ctx.supabase.from("technician_portfolio_items").insert({ technician_profile_id: ctx.technician.id, title, description: text(formData, "description", 500) || null, device_category: text(formData, "deviceCategory", 100) || null, completed_at: text(formData, "completedAt") || null, technologies_used: text(formData, "technologiesUsed", 300) || null, consent_confirmed: true });
  if (error) return { ok: false, message: "Portfolio item could not be saved." };
  revalidatePath(path);
  return { ok: true, message: "Portfolio item saved." };
}

export async function addServiceArea(_previous: TechnicianProfileActionState, formData: FormData): Promise<TechnicianProfileActionState> {
  const ctx = await context();
  if (!ctx.ok) return { ok: false, message: ctx.message };
  const province = text(formData, "province", 80);
  const city = text(formData, "city", 80);
  if (!province || !city) return { ok: false, message: "Province and city are required." };
  const { error } = await ctx.supabase.from("technician_service_areas").insert({ technician_profile_id: ctx.technician.id, province, city, radius_km: intValue(formData, "radiusKm"), remote_support: formData.get("remoteSupport") === "on", onsite_support: formData.get("onsiteSupport") === "on", dropoff_service: formData.get("dropoffService") === "on", collection_service: formData.get("collectionService") === "on" });
  if (error) return { ok: false, message: "Service area could not be saved." };
  revalidatePath(path);
  return { ok: true, message: "Service area saved." };
}

export async function saveBusinessHours(_previous: TechnicianProfileActionState, formData: FormData): Promise<TechnicianProfileActionState> {
  const ctx = await context();
  if (!ctx.ok) return { ok: false, message: ctx.message };
  const day = intValue(formData, "dayOfWeek");
  if (day === null || day < 0 || day > 6) return { ok: false, message: "Choose a valid day." };
  const { error } = await ctx.supabase.from("technician_business_hours").upsert({ technician_profile_id: ctx.technician.id, day_of_week: day, is_closed: formData.get("isClosed") === "on", opens_at: text(formData, "opensAt") || null, closes_at: text(formData, "closesAt") || null, emergency_support: formData.get("emergencySupport") === "on", timezone: text(formData, "timezone", 80) || "Africa/Johannesburg", updated_at: new Date().toISOString() }, { onConflict: "technician_profile_id,day_of_week" });
  if (error) return { ok: false, message: "Business hours could not be saved." };
  revalidatePath(path);
  return { ok: true, message: "Business hours saved." };
}

export async function respondToReview(_previous: TechnicianProfileActionState, formData: FormData): Promise<TechnicianProfileActionState> {
  const ctx = await context();
  if (!ctx.ok) return { ok: false, message: ctx.message };
  const reviewId = text(formData, "reviewId");
  const response = text(formData, "technicianResponse", 800);
  if (!reviewId || response.length < 3) return { ok: false, message: "Write a response before saving." };
  const { error } = await ctx.supabase.from("technician_reviews").update({ technician_response: response, responded_at: new Date().toISOString() }).eq("id", reviewId).eq("technician_profile_id", ctx.technician.id);
  if (error) return { ok: false, message: "Review response could not be saved." };
  revalidatePath(path);
  return { ok: true, message: "Review response saved." };
}