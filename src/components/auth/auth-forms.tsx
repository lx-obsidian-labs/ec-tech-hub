"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ActionState } from "@/lib/auth/actions";
import {
  requestPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  startGoogleSignIn,
  updatePassword,
} from "@/lib/auth/actions";
import { roleDetails, type PublicRole } from "@/lib/auth/roles";

const initialState: ActionState = { status: "idle" };

function SubmitButton({ pending, idle, loading }: { pending: boolean; idle: string; loading: string }) {
  return <button disabled={pending} className="inline-flex min-h-13 w-full items-center justify-center rounded-[14px] bg-[var(--brand-blue)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(21,94,239,0.22)] transition hover:bg-[var(--brand-blue-hover)] disabled:cursor-not-allowed disabled:opacity-70">{pending ? loading : idle}</button>;
}

function Feedback({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <div role="status" className={`rounded-[14px] p-4 text-sm leading-6 ${state.status === "success" ? "bg-[var(--trust-green-surface)] text-[var(--trust-green)]" : "bg-red-50 text-[var(--danger)]"}`}>{state.message}</div>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm text-[var(--danger)]">{message}</p> : null;
}

export function PasswordField({ name, label, autoComplete, error }: { name: string; label: string; autoComplete: string; error?: string }) {
  const [visible, setVisible] = useState(false);
  return <label className="block text-sm font-semibold text-[var(--deep-navy)]">{label}<span className="mt-2 flex h-13 items-center rounded-[14px] bg-[var(--page-bg)] px-4 ring-1 ring-[var(--divider)] focus-within:ring-2 focus-within:ring-[var(--brand-blue)]"><input name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} className="min-w-0 flex-1 bg-transparent outline-none" /><button type="button" onClick={() => setVisible((value) => !value)} className="ml-3 rounded-md p-1 text-[var(--muted-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-blue)]" aria-label={visible ? "Hide password" : "Show password"}>{visible ? "Hide" : "Show"}</button></span><FieldError message={error} /></label>;
}

export function GoogleButton({ returnTo }: { returnTo?: string }) {
  return <form action={startGoogleSignIn}><input type="hidden" name="returnTo" value={returnTo || ""} /><button className="flex min-h-13 w-full items-center justify-center gap-3 rounded-[14px] bg-white px-5 text-sm font-semibold text-[var(--deep-navy)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--divider)] transition hover:bg-[var(--page-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"><span className="grid size-6 place-items-center rounded-full border border-slate-200 text-xs font-bold text-blue-600">G</span>Continue with Google</button></form>;
}

export function AuthDivider() { return <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-[var(--divider)]" /><span className="text-xs font-medium text-[var(--muted-text)]">or continue with email</span><span className="h-px flex-1 bg-[var(--divider)]" /></div>; }

export function SignInForm({ returnTo, error }: { returnTo?: string; error?: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(signInWithEmail, initialState);
  useEffect(() => { if (state.redirectTo) router.push(state.redirectTo); }, [state.redirectTo, router]);
  return <div><GoogleButton returnTo={returnTo} /> <AuthDivider /> <form action={action} className="space-y-5"><input type="hidden" name="returnTo" value={returnTo || ""} />{error ? <Feedback state={{ status: "error", message: error === "config" ? "Authentication is not configured yet. Add Supabase environment variables." : "We could not complete that authentication request." }} /> : null}<Feedback state={state} /><label className="block text-sm font-semibold text-[var(--deep-navy)]">Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" className="mt-2 h-13 w-full rounded-[14px] bg-[var(--page-bg)] px-4 outline-none ring-1 ring-[var(--divider)] focus:ring-2 focus:ring-[var(--brand-blue)]" /><FieldError message={state.fields?.email} /></label><PasswordField name="password" label="Password" autoComplete="current-password" error={state.fields?.password} /><div className="flex justify-end"><Link href="/auth/forgot-password" className="text-sm font-semibold text-[var(--brand-blue)]">Forgot password?</Link></div><SubmitButton pending={pending} idle="Sign In" loading="Signing in…" /></form><p className="mt-6 text-center text-sm text-[var(--secondary-text)]">New to EC TECH HUB? <Link className="font-semibold text-[var(--brand-blue)]" href="/auth/sign-up">Create an account</Link></p></div>;
}

export function SignUpForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signUpWithEmail, initialState);
  useEffect(() => { if (state.redirectTo) router.push(state.redirectTo); }, [state.redirectTo, router]);
  return <div><GoogleButton /> <AuthDivider /> <form action={action} className="space-y-5"><Feedback state={state} /><label className="block text-sm font-semibold text-[var(--deep-navy)]">Full name<input name="fullName" autoComplete="name" placeholder="Your full name" className="mt-2 h-13 w-full rounded-[14px] bg-[var(--page-bg)] px-4 outline-none ring-1 ring-[var(--divider)] focus:ring-2 focus:ring-[var(--brand-blue)]" /><FieldError message={state.fields?.fullName} /></label><label className="block text-sm font-semibold text-[var(--deep-navy)]">Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" className="mt-2 h-13 w-full rounded-[14px] bg-[var(--page-bg)] px-4 outline-none ring-1 ring-[var(--divider)] focus:ring-2 focus:ring-[var(--brand-blue)]" /><FieldError message={state.fields?.email} /></label><RoleCards error={state.fields?.role} /><PasswordField name="password" label="Password" autoComplete="new-password" error={state.fields?.password} /><p className="-mt-2 text-sm text-[var(--muted-text)]">Use at least 8 characters.</p><PasswordField name="confirmPassword" label="Confirm password" autoComplete="new-password" error={state.fields?.confirmPassword} /><label className="flex gap-3 text-sm leading-6 text-[var(--secondary-text)]"><input name="acceptedTerms" type="checkbox" className="mt-1 size-4 rounded border-slate-300" /> <span>I agree to the <Link href="/terms" className="font-semibold text-[var(--brand-blue)]">Terms of Service</Link> and <Link href="/privacy" className="font-semibold text-[var(--brand-blue)]">Privacy Policy</Link>.</span></label><FieldError message={state.fields?.acceptedTerms} /><SubmitButton pending={pending} idle="Create account" loading="Creating account…" /></form><p className="mt-6 text-center text-sm text-[var(--secondary-text)]">Already have an account? <Link className="font-semibold text-[var(--brand-blue)]" href="/auth/sign-in">Sign in</Link></p></div>;
}

function RoleCards({ error }: { error?: string }) {
  const roles: PublicRole[] = ["customer", "technician", "business", "student"];
  return <fieldset><legend className="text-sm font-semibold text-[var(--deep-navy)]">Account type</legend><div className="mt-3 grid gap-3">{roles.map((role) => <label key={role} className="has-[:checked]:ring-[var(--brand-blue)] has-[:checked]:bg-[var(--blue-surface)] flex cursor-pointer gap-3 rounded-[16px] bg-[var(--page-bg)] p-4 ring-1 ring-[var(--divider)]"><input type="radio" name="role" value={role} className="mt-1" /><span><span className="block font-semibold text-[var(--deep-navy)]">{roleDetails[role].title}</span><span className="mt-1 block text-sm leading-6 text-[var(--secondary-text)]">{roleDetails[role].description}</span></span></label>)}</div><FieldError message={error} /></fieldset>;
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);
  return <form action={action} className="space-y-5"><Feedback state={state} /><label className="block text-sm font-semibold text-[var(--deep-navy)]">Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" className="mt-2 h-13 w-full rounded-[14px] bg-[var(--page-bg)] px-4 outline-none ring-1 ring-[var(--divider)] focus:ring-2 focus:ring-[var(--brand-blue)]" /><FieldError message={state.fields?.email} /></label><SubmitButton pending={pending} idle="Send Reset Link" loading="Sending link…" /><Link href="/auth/sign-in" className="block text-center text-sm font-semibold text-[var(--brand-blue)]">Return to sign in</Link></form>;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(updatePassword, initialState);
  useEffect(() => { if (state.redirectTo) router.push(state.redirectTo); }, [state.redirectTo, router]);
  return <form action={action} className="space-y-5"><Feedback state={state} /><PasswordField name="password" label="New password" autoComplete="new-password" error={state.fields?.password} /><PasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password" error={state.fields?.confirmPassword} /><SubmitButton pending={pending} idle="Update password" loading="Updating password…" /></form>;
}
