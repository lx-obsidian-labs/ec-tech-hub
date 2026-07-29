import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

export async function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies. Middleware refreshes sessions.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export type CurrentProfile = {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  role: string | null;
  onboarding_status: string | null;
};

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,auth_user_id,full_name,display_name,email,role,onboarding_status")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as CurrentProfile;
}
