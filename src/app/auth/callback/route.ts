import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirectForRole, safeReturnTo } from "@/lib/auth/redirects";
import { getSiteUrl } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeReturnTo(url.searchParams.get("next"), "/onboarding");
  if (!code) return NextResponse.redirect(`${getSiteUrl()}/auth/sign-in?error=callback`);
  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(`${getSiteUrl()}/auth/sign-in?error=config`);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${getSiteUrl()}/auth/sign-in?error=callback`);

  if (next === "/auth/reset-password") {
    return NextResponse.redirect(`${getSiteUrl()}${next}`);
  }

  const userId = data.user?.id;
  if (!userId) return NextResponse.redirect(`${getSiteUrl()}/auth/sign-in?error=callback`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,onboarding_status")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (!profile?.role) return NextResponse.redirect(`${getSiteUrl()}/onboarding`);

  const roleDestination = redirectForRole(profile.role, profile.onboarding_status);
  const destination = next === "/onboarding" ? roleDestination : next;
  return NextResponse.redirect(`${getSiteUrl()}${destination}`);
}
