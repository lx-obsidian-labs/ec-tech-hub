"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export type MarketplaceActionState = { ok: boolean; message?: string };

async function actionContext() {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false as const, message: "Sign in to use marketplace actions." };
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, message: "Supabase is not configured." };
  return { ok: true as const, profile, supabase };
}

function text(formData: FormData, key: string, max = 1200) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function saveMarketplaceProduct(_previous: MarketplaceActionState, formData: FormData): Promise<MarketplaceActionState> {
  const ctx = await actionContext();
  if (!ctx.ok) return { ok: false, message: ctx.message };
  const productId = text(formData, "productId", 80);
  if (!productId) return { ok: false, message: "Missing product." };
  const { data: product, error: productError } = await ctx.supabase.from("marketplace_products").select("id,status").eq("id", productId).eq("status", "approved").maybeSingle();
  if (productError || !product) return { ok: false, message: "This product is unavailable." };
  const { error } = await ctx.supabase.from("marketplace_saved_products").insert({ profile_id: ctx.profile.id, product_id: productId });
  if (error && !String(error.message || "").toLowerCase().includes("duplicate")) return { ok: false, message: "Product could not be saved." };
  revalidatePath("/marketplace");
  return { ok: true, message: "Product saved." };
}

export async function removeSavedMarketplaceProduct(_previous: MarketplaceActionState, formData: FormData): Promise<MarketplaceActionState> {
  const ctx = await actionContext();
  if (!ctx.ok) return { ok: false, message: ctx.message };
  const productId = text(formData, "productId", 80);
  if (!productId) return { ok: false, message: "Missing product." };
  const { error } = await ctx.supabase.from("marketplace_saved_products").delete().eq("profile_id", ctx.profile.id).eq("product_id", productId);
  if (error) return { ok: false, message: "Saved product could not be removed." };
  revalidatePath("/marketplace");
  return { ok: true, message: "Product removed from saved list." };
}

export async function requestMarketplaceQuote(_previous: MarketplaceActionState, formData: FormData): Promise<MarketplaceActionState> {
  const ctx = await actionContext();
  if (!ctx.ok) return { ok: false, message: ctx.message };
  const productId = text(formData, "productId", 80);
  if (!productId) return { ok: false, message: "Missing product." };
  const { data: product, error: productError } = await ctx.supabase.from("marketplace_products").select("id,seller_id,status").eq("id", productId).eq("status", "approved").maybeSingle();
  if (productError || !product) return { ok: false, message: "This product is unavailable." };
  const { error } = await ctx.supabase.from("marketplace_quote_requests").insert({ product_id: product.id, seller_id: product.seller_id, requester_profile_id: ctx.profile.id, preferred_contact: text(formData, "preferredContact", 80) || null, message: text(formData, "message", 1000) || null });
  if (error) return { ok: false, message: "Quote request could not be sent." };
  revalidatePath("/marketplace");
  return { ok: true, message: "Quote request sent to the seller." };
}