"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, hasSupabaseEnv } from "@/lib/supabase/config";
import { authErrorMessage } from "@/lib/auth/errors";
import { isPublicRole, type PublicRole } from "@/lib/auth/roles";
import { redirectForRole, safeReturnTo } from "@/lib/auth/redirects";
import { asString, validateNewPassword, validateResetRequest, validateSignIn, validateSignUp } from "@/lib/auth/validation";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fields?: Record<string, string>;
  redirectTo?: string;
};

const configError: ActionState = {
  status: "error",
  message: "Authentication is not configured yet. Add the Supabase environment variables to enable this flow.",
};

async function getProfile(userId: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("profiles").select("id,role,onboarding_status").eq("auth_user_id", userId).maybeSingle();
  return data as { id: string; role: string | null; onboarding_status: string | null } | null;
}

async function upsertProfile(input: { authUserId: string; email?: string | null; fullName?: string | null; role?: PublicRole; onboardingStatus?: string }) {
  const supabase = await createClient();
  if (!supabase) return;
  const { error } = await supabase.from("profiles").upsert({
    auth_user_id: input.authUserId,
    email: input.email,
    full_name: input.fullName,
    display_name: input.fullName,
    role: input.role,
    onboarding_status: input.onboardingStatus || "incomplete",
    updated_at: new Date().toISOString(),
  }, { onConflict: "auth_user_id" });
  return error;
}

export async function signInWithEmail(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!hasSupabaseEnv()) return configError;
  const validated = validateSignIn(formData);
  if (!validated.ok) return { status: "error", message: "Check the highlighted fields.", fields: validated.errors };
  const returnTo = safeReturnTo(asString(formData, "returnTo"));
  const supabase = await createClient();
  if (!supabase) return configError;
  const { data, error } = await supabase.auth.signInWithPassword({ email: validated.email, password: validated.password });
  if (error) return { status: "error", message: authErrorMessage(error.message) };
  const profile = data.user ? await getProfile(data.user.id) : null;
  return { status: "success", message: "Welcome back. Redirecting to your workspace.", redirectTo: returnTo || redirectForRole(profile?.role, profile?.onboarding_status) };
}

export async function signUpWithEmail(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!hasSupabaseEnv()) return configError;
  const validated = validateSignUp(formData);
  if (!validated.ok) return { status: "error", message: "Check the highlighted fields.", fields: validated.errors };
  const supabase = await createClient();
  if (!supabase) return configError;
  const emailRedirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(`/onboarding/${validated.role}`)}`;
  const { data, error } = await supabase.auth.signUp({
    email: validated.email,
    password: validated.password,
    options: { emailRedirectTo, data: { full_name: validated.fullName, role: validated.role } },
  });
  if (error) return { status: "error", message: authErrorMessage(error.message) };
  if (data.user) {
    const profileError = await upsertProfile({ authUserId: data.user.id, email: validated.email, fullName: validated.fullName, role: validated.role, onboardingStatus: "incomplete" });
    if (profileError) return { status: "error", message: "Your account was created, but we could not finish setting up your profile. Please contact support." };
  }
  return { status: "success", message: "Account created. Check your email to verify your address.", redirectTo: `/auth/verify-email?email=${encodeURIComponent(validated.email)}` };
}

export async function startGoogleSignIn(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/auth/sign-in?error=config");
  const supabase = await createClient();
  if (!supabase) redirect("/auth/sign-in?error=config");
  const returnTo = safeReturnTo(asString(formData, "returnTo"), "/onboarding");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(returnTo)}` },
  });
  if (error || !data.url) redirect("/auth/sign-in?error=oauth");
  redirect(data.url);
}

export async function requestPasswordReset(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!hasSupabaseEnv()) return configError;
  const validated = validateResetRequest(formData);
  if (!validated.ok) return { status: "error", message: "Check the highlighted fields.", fields: validated.errors };
  const supabase = await createClient();
  if (!supabase) return configError;
  const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
  });
  if (error) return { status: "error", message: authErrorMessage(error.message) };
  return { status: "success", message: "If an account exists for that email address, a reset link has been sent." };
}

export async function updatePassword(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!hasSupabaseEnv()) return configError;
  const validated = validateNewPassword(formData);
  if (!validated.ok) return { status: "error", message: "Check the highlighted fields.", fields: validated.errors };
  const supabase = await createClient();
  if (!supabase) return configError;
  const { error } = await supabase.auth.updateUser({ password: validated.password });
  if (error) return { status: "error", message: authErrorMessage(error.message) };
  return { status: "success", message: "Your password has been updated.", redirectTo: "/auth/sign-in" };
}

export async function saveRole(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/onboarding?error=config");
  const roleValue = formData.get("role");
  if (!isPublicRole(roleValue)) redirect("/onboarding?error=role");
  const supabase = await createClient();
  if (!supabase) redirect("/onboarding?error=config");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?returnTo=/onboarding");
  await upsertProfile({ authUserId: user.id, email: user.email, fullName: user.user_metadata?.full_name, role: roleValue, onboardingStatus: "incomplete" });
  revalidatePath("/onboarding");
  redirect(`/onboarding/${roleValue}`);
}

export async function saveOnboarding(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/onboarding?error=config");
  const flow = asString(formData, "flow");
  const status = asString(formData, "status") || "complete";
  if (!isPublicRole(flow as PublicRole) || !["incomplete", "submitted", "complete"].includes(status)) redirect("/onboarding?error=invalid");
  const supabase = await createClient();
  if (!supabase) redirect("/onboarding?error=config");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?returnTo=/onboarding/${flow}`);
  const profile = await getProfile(user.id);
  if (!profile) redirect("/onboarding?error=profile");
  if (profile.role && profile.role !== flow) redirect("/unauthorized");

  const draftData = Object.fromEntries([...formData.entries()].filter(([key]) => !["flow", "status"].includes(key)).map(([key, value]) => [key, typeof value === "string" ? value : value.name]));
  await supabase.from("onboarding_progress").upsert({
    profile_id: profile.id,
    flow_type: flow,
    current_step: status === "submitted" ? "review" : "complete",
    completed_steps: [],
    draft_data: draftData,
    updated_at: new Date().toISOString(),
  }, { onConflict: "profile_id,flow_type" });

  const profileUpdate = {
    full_name: typeof draftData.fullName === "string" ? draftData.fullName : undefined,
    display_name: typeof draftData.displayName === "string" ? draftData.displayName : typeof draftData.publicName === "string" ? draftData.publicName : undefined,
    phone: typeof draftData.phone === "string" ? draftData.phone : undefined,
    province: typeof draftData.province === "string" ? draftData.province : undefined,
    city: typeof draftData.city === "string" ? draftData.city : undefined,
    onboarding_status: status,
    updated_at: new Date().toISOString(),
  };
  await supabase.from("profiles").update(profileUpdate).eq("auth_user_id", user.id);

  if (flow === "technician") {
    await supabase.from("technician_profiles").upsert({
      profile_id: profile.id,
      headline: typeof draftData.headline === "string" ? draftData.headline : null,
      biography: typeof draftData.biography === "string" ? draftData.biography : null,
      years_experience: typeof draftData.yearsExperience === "string" && draftData.yearsExperience ? Number(draftData.yearsExperience) : null,
      service_area: [draftData.province, draftData.city].filter(Boolean).join(", ") || null,
      verification_status: "submitted",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "profile_id" });
    await supabase.from("verification_submissions").insert({
      owner_profile_id: profile.id,
      owner_type: "technician",
      status: "submitted",
    });
  }

  if (flow === "business") {
    await supabase.from("business_profiles").upsert({
      profile_id: profile.id,
      business_name: typeof draftData.businessName === "string" ? draftData.businessName : "Business profile",
      registration_number: typeof draftData.registrationNumber === "string" ? draftData.registrationNumber : null,
      category: typeof draftData.categories === "string" ? draftData.categories : null,
      description: typeof draftData.description === "string" ? draftData.description : null,
      verification_status: "submitted",
      updated_at: new Date().toISOString(),
    }, { onConflict: "profile_id" });
    await supabase.from("verification_submissions").insert({
      owner_profile_id: profile.id,
      owner_type: "business",
      status: "submitted",
    });
  }

  if (flow === "technician") redirect("/technician/dashboard?status=submitted");
  if (flow === "business") redirect("/business/dashboard?status=submitted");
  if (flow === "customer") redirect("/dashboard");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
