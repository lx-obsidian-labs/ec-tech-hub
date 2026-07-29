import Link from "next/link";
import { redirect } from "next/navigation";
import { TechnicianProfileWorkspace, type Analytics, type BaseProfile, type BusinessHour, type Certification, type PortfolioItem, type Review, type ServiceArea, type Skill, type TechProfile, type VerificationSubmission } from "@/components/technicians/technician-profile-workspace";
import { ButtonLink } from "@/components/ui/button";
import { createClient, getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

export const metadata = { title: "Technician Profile | EC TECH HUB", description: "Manage technician verification, reputation, portfolio, availability, and business analytics." };

type RepairMetricRow = { id: string; profile_id: string; status: string; device_category: string; service_preference: string; province: string; city: string; submitted_at: string; completed_at: string | null; assigned_technician_profile_id: string | null };
type CustomerRow = { id: string; display_name: string | null; full_name: string | null };
type ReviewRow = Omit<Review, "customer" | "repair"> & { customer_profile_id: string | null; repair_request_id: string | null };
type ReviewRepairRow = { id: string; reference: string; device_category: string; brand: string; model: string };

async function safe<T>(query: PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  const { data, error } = await query;
  return error || !data ? fallback : data;
}

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/technician/profile");
  const current = await getCurrentProfile();
  if (current?.role !== "technician" && current?.role !== "administrator") redirect("/unauthorized");
  const supabase = await createClient();
  if (!supabase) return <WorkspaceError title="Technician Profile" message="Supabase is not configured for this environment. Profile data cannot be loaded." />;

  const profile = await safe<BaseProfile | null>(supabase.from("profiles").select("id,full_name,display_name,avatar_url,email,phone,province,city,created_at,onboarding_status").eq("id", current.id).maybeSingle(), null);
  if (!profile) redirect("/auth/sign-in?returnTo=/technician/profile");

  let technician = await safe<TechProfile>(supabase.from("technician_profiles").select("id,profile_id,headline,professional_title,biography,years_experience,service_area,verification_status,submitted_at,approved_at,languages,education,memberships,availability_status,accepting_urgent_repairs,expected_response_time,show_phone,show_email,show_business_address,show_portfolio,show_availability,public_slug,created_at,updated_at").eq("profile_id", profile.id).maybeSingle(), null);
  if (!technician) {
    const { data } = await supabase.from("technician_profiles").insert({ profile_id: profile.id, verification_status: "not_started" }).select("id,profile_id,headline,biography,years_experience,service_area,verification_status,submitted_at,approved_at,created_at,updated_at").single();
    technician = data as TechProfile;
  }

  const technicianId = technician?.id;
  const [skills, certifications, portfolio, serviceAreas, businessHours, submissions, repairs] = technicianId ? await Promise.all([
    safe<Skill[]>(supabase.from("technician_skills").select("id,skill_name,experience_level,years_experience,verification_status").eq("technician_profile_id", technicianId).order("skill_name"), []),
    safe<Certification[]>(supabase.from("technician_certifications").select("id,certification_name,issuing_organization,issue_date,expiry_date,credential_id,verification_status,file_name,created_at").eq("technician_profile_id", technicianId).order("created_at", { ascending: false }), []),
    safe<PortfolioItem[]>(supabase.from("technician_portfolio_items").select("id,title,description,device_category,completed_at,technologies_used,before_file_name,after_file_name,consent_confirmed,created_at").eq("technician_profile_id", technicianId).order("created_at", { ascending: false }), []),
    safe<ServiceArea[]>(supabase.from("technician_service_areas").select("id,province,city,radius_km,remote_support,onsite_support,dropoff_service,collection_service").eq("technician_profile_id", technicianId).order("city"), []),
    safe<BusinessHour[]>(supabase.from("technician_business_hours").select("id,day_of_week,is_closed,opens_at,closes_at,emergency_support,timezone").eq("technician_profile_id", technicianId).order("day_of_week"), []),
    safe<VerificationSubmission[]>(supabase.from("verification_submissions").select("id,status,submitted_at,reviewed_at,rejection_reason_public").eq("owner_profile_id", profile.id).eq("owner_type", "technician").order("submitted_at", { ascending: false }), []),
    safe<RepairMetricRow[]>(supabase.from("repair_requests").select("id,profile_id,status,device_category,service_preference,province,city,submitted_at,completed_at,assigned_technician_profile_id").eq("assigned_technician_profile_id", profile.id).order("submitted_at", { ascending: false }).limit(500), []),
  ]) : [[], [], [], [], [], [], []];

  const reviewRows = technicianId ? await safe<ReviewRow[]>(supabase.from("technician_reviews").select("id,rating,review_text,technician_response,created_at,customer_profile_id,repair_request_id").eq("technician_profile_id", technicianId).order("created_at", { ascending: false }).limit(100), []) : [];
  const customerIds = Array.from(new Set(reviewRows.map((row) => row.customer_profile_id).filter(Boolean))) as string[];
  const repairIds = Array.from(new Set(reviewRows.map((row) => row.repair_request_id).filter(Boolean))) as string[];
  const [reviewCustomers, reviewRepairs] = await Promise.all([
    customerIds.length ? safe<CustomerRow[]>(supabase.from("profiles").select("id,display_name,full_name").in("id", customerIds), []) : Promise.resolve([]),
    repairIds.length ? safe<ReviewRepairRow[]>(supabase.from("repair_requests").select("id,reference,device_category,brand,model").in("id", repairIds), []) : Promise.resolve([]),
  ]);
  const reviews: Review[] = reviewRows.map((review) => ({ ...review, customer: reviewCustomers.find((customer) => customer.id === review.customer_profile_id) || null, repair: reviewRepairs.find((repair) => repair.id === review.repair_request_id) || null }));
  const analytics = buildAnalytics(repairs, reviews);

  return <main id="main-content" className="bg-[var(--page-bg)]">
    <section className="container-grid py-8 sm:py-10 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-2 text-sm text-[var(--secondary-text)]"><Link href="/technician/dashboard" className="font-semibold text-[var(--brand-blue)] hover:underline">Technician Dashboard</Link><span>/</span><span>Profile</span></nav>
      <TechnicianProfileWorkspace data={{ profile, technician, skills, certifications, portfolio, serviceAreas, businessHours, reviews, submissions, analytics }} />
    </section>
  </main>;
}

function buildAnalytics(repairs: RepairMetricRow[], reviews: Review[]): Analytics {
  const completed = repairs.filter((repair) => repair.status === "completed" || repair.completed_at);
  const active = repairs.filter((repair) => !["completed", "cancelled"].includes(repair.status));
  const uniqueCustomers = new Set(repairs.map((repair) => repair.profile_id));
  const repeatCustomers = Array.from(uniqueCustomers).filter((id) => repairs.filter((repair) => repair.profile_id === id).length > 1).length;
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;
  const completionRate = repairs.length ? Math.round((completed.length / repairs.length) * 100) : null;
  const durations = completed.map((repair) => repair.completed_at ? (new Date(repair.completed_at).getTime() - new Date(repair.submitted_at).getTime()) / 86400000 : null).filter((value): value is number => value !== null && value >= 0);
  return { jobsCompleted: completed.length, activeJobs: active.length, repeatCustomers: repairs.length ? repeatCustomers : null, averageRating, completionRate, averageCompletionDays: durations.length ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10 : null, repairVolume: groupByMonth(completed), deviceMix: groupCount(repairs, "device_category"), serviceMix: groupCount(repairs, "service_preference"), topAreas: groupCount(repairs.map((repair) => ({ area: `${repair.city}, ${repair.province}` })), "area") };
}

function groupCount<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  const counts = new Map<string, number>();
  rows.forEach((row) => { const raw = row[key]; if (typeof raw === "string" && raw) counts.set(raw, (counts.get(raw) || 0) + 1); });
  return Array.from(counts.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
}

function groupByMonth(rows: RepairMetricRow[]) {
  const counts = new Map<string, number>();
  rows.forEach((row) => { const label = new Intl.DateTimeFormat("en-ZA", { month: "short", year: "numeric" }).format(new Date(row.completed_at || row.submitted_at)); counts.set(label, (counts.get(label) || 0) + 1); });
  return Array.from(counts.entries()).map(([label, value]) => ({ label, value })).slice(0, 6);
}

function WorkspaceError({ title, message }: { title: string; message: string }) {
  return <main id="main-content" className="bg-[var(--page-bg)]"><section className="container-grid py-16"><div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)]"><h1 className="text-4xl font-bold text-[var(--deep-navy)]">{title}</h1><p className="mt-4 text-[var(--secondary-text)]">{message}</p><ButtonLink href="/technician/dashboard" className="mt-6">Return to dashboard</ButtonLink></div></section></main>;
}