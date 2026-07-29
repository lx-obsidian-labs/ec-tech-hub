import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export default function Page() {
  return <AuthShell title="Reset your password" description="Enter the email address linked to your account. We’ll send you a secure reset link."><ForgotPasswordForm /></AuthShell>;
}
