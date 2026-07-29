import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/auth-forms";

export default function Page() {
  return <AuthShell title="Create your EC TECH HUB account" description="Choose your account type and start using Africa’s connected technology ecosystem."><SignUpForm /></AuthShell>;
}
