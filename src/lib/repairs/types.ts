export const deviceCategories = ["Smartphone", "Laptop", "Desktop", "Tablet", "Printer", "Gaming Console", "Television", "Router", "Smart Device", "Other"] as const;
export const warrantyStatuses = ["Unknown", "Still under warranty", "Warranty expired", "No warranty"] as const;
export const approximateAges = ["Less than 6 months", "6–12 months", "1–2 years", "2–4 years", "More than 4 years", "Not sure"] as const;
export const urgencyOptions = [
  { value: "low", label: "Low", description: "The device can wait a few days." },
  { value: "normal", label: "Normal", description: "I need support soon, but it is not urgent." },
  { value: "urgent", label: "Urgent", description: "This affects work, school, or daily tasks." },
  { value: "safety", label: "Safety concern", description: "The device is hot, wet, swollen, sparking, or unsafe." },
] as const;
export const servicePreferences = [
  { value: "drop_off", label: "Drop-off", description: "I can take the device to a suitable provider." },
  { value: "technician_visit", label: "Technician visit", description: "I prefer a technician to come to my area." },
  { value: "remote_assistance", label: "Remote assistance", description: "Start with safe remote guidance where possible." },
] as const;
export const provinces = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape", "Outside South Africa"] as const;
export const symptomOptions = ["Does not power on", "Screen or display issue", "Battery or charging", "Overheating", "Physical damage", "Slow performance", "Network or Wi-Fi", "Sound or microphone", "Software error", "Data loss", "Other"] as const;

export type RepairDraft = {
  deviceCategory?: string;
  brand?: string;
  model?: string;
  approximateAge?: string;
  warrantyStatus?: string;
  purchaseDate?: string;
  problemTitle?: string;
  problemDescription?: string;
  symptoms?: string[];
  startedWhen?: string;
  repairedBefore?: string;
  urgency?: string;
  province?: string;
  city?: string;
  area?: string;
  servicePreference?: string;
  locationNotes?: string;
};

export type RepairAttachmentInput = {
  storagePath: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
};

export type SubmitRepairInput = RepairDraft & {
  confirmationAccepted?: boolean;
  attachments?: RepairAttachmentInput[];
};

export type RepairActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  reference?: string;
  repairId?: string;
  redirectTo?: string;
};