import { redirect } from "next/navigation";
﻿import { OnboardingShell, CustomerOnboardingForm } from "@/components/onboarding/onboarding-components";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/onboarding/customer");
  const profile = await getCurrentProfile();
  if (profile?.role && !["customer", "student"].includes(profile.role)) redirect("/unauthorized");
  return <OnboardingShell title="Complete your customer profile" description="Add the minimum details needed to request repairs, find technicians, and receive useful support."><CustomerOnboardingForm /></OnboardingShell>;
}
