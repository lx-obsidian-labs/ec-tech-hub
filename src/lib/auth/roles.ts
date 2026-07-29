export const publicRoles = ["customer", "technician", "business", "student"] as const;
export const allRoles = [...publicRoles, "administrator"] as const;

export type PublicRole = (typeof publicRoles)[number];
export type AccountRole = (typeof allRoles)[number];
export type OnboardingStatus = "role_required" | "incomplete" | "submitted" | "complete" | "more_information_required";

export function isPublicRole(value: FormDataEntryValue | string | null): value is PublicRole {
  return typeof value === "string" && (publicRoles as readonly string[]).includes(value);
}

export const roleDetails: Record<PublicRole, { title: string; description: string; capabilities: string[] }> = {
  customer: {
    title: "Customer",
    description: "Request repairs, find technicians, use AI support, and explore technology services.",
    capabilities: ["Repair requests", "AI troubleshooting", "Marketplace access"],
  },
  technician: {
    title: "Technician",
    description: "Build a professional profile, receive service requests, and grow your reputation.",
    capabilities: ["Professional profile", "Service categories", "Verification review"],
  },
  business: {
    title: "Business",
    description: "List technology services, create a business presence, and connect with customers.",
    capabilities: ["Business profile", "Digital services", "Verification review"],
  },
  student: {
    title: "Student",
    description: "Follow learning pathways and build practical technology skills.",
    capabilities: ["Learning dashboard", "AI support", "Career topics"],
  },
};
