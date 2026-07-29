import { isPublicRole, type PublicRole } from "./roles";

export type FieldErrors = Record<string, string>;

export function asString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string) {
  return password.length >= 8;
}

export function validateSignIn(formData: FormData) {
  const email = asString(formData, "email").toLowerCase();
  const password = String(formData.get("password") || "");
  const errors: FieldErrors = {};
  if (!validateEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  return { email, password, errors, ok: Object.keys(errors).length === 0 };
}

export function validateSignUp(formData: FormData) {
  const fullName = asString(formData, "fullName");
  const email = asString(formData, "email").toLowerCase();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const roleValue = formData.get("role");
  const acceptedTerms = formData.get("acceptedTerms") === "on";
  const errors: FieldErrors = {};
  if (fullName.length < 2) errors.fullName = "Enter your full name.";
  if (!validateEmail(email)) errors.email = "Enter a valid email address.";
  if (!validatePassword(password)) errors.password = "Use at least 8 characters.";
  if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
  if (!isPublicRole(roleValue)) errors.role = "Choose how you will use EC TECH HUB.";
  if (!acceptedTerms) errors.acceptedTerms = "You must agree to the Terms and Privacy Policy.";
  return { fullName, email, password, role: roleValue as PublicRole, errors, ok: Object.keys(errors).length === 0 };
}

export function validateResetRequest(formData: FormData) {
  const email = asString(formData, "email").toLowerCase();
  const errors: FieldErrors = {};
  if (!validateEmail(email)) errors.email = "Enter a valid email address.";
  return { email, errors, ok: Object.keys(errors).length === 0 };
}

export function validateNewPassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const errors: FieldErrors = {};
  if (!validatePassword(password)) errors.password = "Use at least 8 characters.";
  if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
  return { password, errors, ok: Object.keys(errors).length === 0 };
}
