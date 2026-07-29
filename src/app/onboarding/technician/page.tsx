import { redirect } from "next/navigation";
﻿import { OnboardingShell, TechnicianOnboardingForm } from "@/components/onboarding/onboarding-components";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/onboarding/technician");
  const profile = await getCurrentProfile();
  if (profile?.role && profile.role !== "technician") redirect("/unauthorized");
  return <OnboardingShell title="Build your technician profile" description="Complete your professional profile and submit it for verification review. You will not be marked verified immediately."><TechnicianOnboardingForm /></OnboardingShell>;
}
