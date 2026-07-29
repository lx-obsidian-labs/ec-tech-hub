import { redirect } from "next/navigation";
﻿import { OnboardingShell, BusinessOnboardingForm } from "@/components/onboarding/onboarding-components";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/onboarding/business");
  const profile = await getCurrentProfile();
  if (profile?.role && profile.role !== "business") redirect("/unauthorized");
  return <OnboardingShell title="Register your technology business" description="Create a clear business profile and submit verification evidence for review."><BusinessOnboardingForm /></OnboardingShell>;
}
