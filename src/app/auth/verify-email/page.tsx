import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";

function maskEmail(email?: string) {
  if (!email || !email.includes("@")) return "your email address";
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}${"•".repeat(Math.min(5, Math.max(2, name.length - 1)))}@${domain}`;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const params = await searchParams;
  return <AuthShell title="Check your email" description={`We sent a verification link to ${maskEmail(params.email)}. Open the link to confirm your account and continue.`}><div className="space-y-5 text-sm leading-7 text-[var(--secondary-text)]"><p>Check your spam or junk folder if the message does not arrive. Verification links may expire; request a new link by signing up or contacting support.</p><div className="flex flex-col gap-3 sm:flex-row"><Link href="/auth/sign-in" className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--brand-blue)] px-5 font-semibold text-white">Return to sign in</Link><Link href="/auth/sign-up" className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--blue-surface)] px-5 font-semibold text-[var(--brand-blue)]">Change email address</Link></div></div></AuthShell>;
}
