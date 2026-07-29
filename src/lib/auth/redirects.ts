const allowedPrefixes = ["/", "/repairs", "/technicians", "/marketplace", "/learn", "/ai-assist", "/services", "/verification", "/dashboard", "/account", "/onboarding", "/technician", "/business"];

export function safeReturnTo(value: string | null | undefined, fallback = "/onboarding") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return allowedPrefixes.some((prefix) => value === prefix || value.startsWith(`${prefix}/`) || value.startsWith(`${prefix}?`)) ? value : fallback;
}

export function redirectForRole(role: string | null | undefined, onboardingStatus?: string | null) {
  if (!role) return "/onboarding";
  if (role === "customer") return onboardingStatus === "complete" ? "/dashboard" : "/onboarding/customer";
  if (role === "technician") return onboardingStatus === "complete" || onboardingStatus === "submitted" ? "/technician/dashboard" : "/onboarding/technician";
  if (role === "business") return onboardingStatus === "complete" || onboardingStatus === "submitted" ? "/business/dashboard" : "/onboarding/business";
  if (role === "student") return onboardingStatus === "complete" ? "/learn/dashboard" : "/onboarding/customer";
  if (role === "administrator") return "/admin";
  return "/onboarding";
}
