import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export default function Page() {
  return <AuthShell title="Choose a new password" description="Use the secure reset link from your email to update your password."><ResetPasswordForm /></AuthShell>;
}
