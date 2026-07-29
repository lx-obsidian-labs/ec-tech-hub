import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/auth-forms";

export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  return <AuthShell title="Welcome back" description="Sign in to manage repairs, connect with technicians, explore services, and continue where you left off."><SignInForm returnTo={params.returnTo} error={params.error} /></AuthShell>;
}
