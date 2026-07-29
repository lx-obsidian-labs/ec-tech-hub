import { redirect } from "next/navigation";
﻿import { OnboardingShell, RoleSelection } from "@/components/onboarding/onboarding-components";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?returnTo=/onboarding");
  return <OnboardingShell title="How will you use EC TECH HUB?" description="Choose the account type that best matches what you want to do. You can add more capabilities later where supported."><RoleSelection /></OnboardingShell>;
}
