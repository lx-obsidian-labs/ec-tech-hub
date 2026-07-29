export function authErrorMessage(message?: string) {
  const lower = (message || "").toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) return "Email or password is incorrect.";
  if (lower.includes("email not confirmed") || lower.includes("confirm")) return "Please verify your email before signing in.";
  if (lower.includes("rate") || lower.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  if (lower.includes("network") || lower.includes("fetch")) return "We could not reach the authentication service. Check your connection and try again.";
  if (lower.includes("disabled") || lower.includes("suspended")) return "This account cannot sign in right now. Contact support if you believe this is a mistake.";
  if (lower.includes("supabase is not configured") || lower.includes("missing")) return "Authentication is not configured yet. Add the Supabase environment variables to enable this flow.";
  return "We could not complete that action right now. Please try again.";
}
