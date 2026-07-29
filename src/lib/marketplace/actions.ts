"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export type MarketplaceActionState = { ok: boolean; message?: string };

export async function createAdminMarketplaceProduct(_previous: MarketplaceActionState, formData: FormData): Promise<MarketplaceActionState> {
  const ctx = await actionContext();
  if (!ctx.ok) return { ok: false, message: ctx.message };
  if (ctx.profile.role !== "administrator") return { ok: false, message: "Only administrators can publish marketplace products." };
  const title = text(formData, "title", 160);
  const category = text(formData, "category", 80);
  const condition = text(formData, "condition", 30);
  const description = text(formData, "description", 1200);
  const sellerName = text(formData, "sellerName", 160) || "EC TECH HUB Marketplace";
  const city = text(formData, "city", 80);
  const province = text(formData, "province", 80);
  const brand = text(formData, "brand", 80);
  const model = text(formData, "model", 120);
  const price = Number(text(formData, "price", 30));
  const file = formData.get("image");
  const validConditions = ["new", "open_box", "refurbished", "used", "for_parts"];
  if (title.length < 3 || !category || !validConditions.includes(condition)) return { ok: false, message: "Add a title, category, and valid condition." };
  if (file instanceof File && file.size > 10 * 1024 * 1024) return { ok: false, message: "Product images must be 10 MB or smaller." };
  if (file instanceof File && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { ok: false, message: "Use a JPG, PNG, or WebP product image." };
  const { data: seller, error: sellerError } = await ctx.supabase.from("marketplace_sellers").upsert({ profile_id: ctx.profile.id, seller_type: "business", display_name: sellerName, city: city || null, province: province || null, verification_status: "approved", is_active: true, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "profile_id" }).select("id").single();
  if (sellerError || !seller) return { ok: false, message: "Marketplace seller profile could not be prepared." };
  const now = new Date().toISOString();
  const { data: product, error: productError } = await ctx.supabase.from("marketplace_products").insert({ seller_id: seller.id, title, slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`, category, brand: brand || null, model: model || null, short_description: description || null, condition, availability_status: "available", location_city: city || null, location_province: province || null, price_amount: Number.isFinite(price) && price >= 0 ? price : null, currency: Number.isFinite(price) && price >= 0 ? "ZAR" : null, show_price: Number.isFinite(price) && price >= 0, is_featured: formData.get("featured") === "on", status: "approved", approved_at: now, published_at: now, submitted_at: now, updated_at: now }).select("id").single();
  if (productError || !product) return { ok: false, message: "Product could not be created." };
  if (file instanceof File && file.size > 0) {
    const path = `admin/${product.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const upload = await ctx.supabase.storage.from("marketplace-products").upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) return { ok: false, message: "Product created, but its image could not be uploaded." };
    const { data: publicUrl } = ctx.supabase.storage.from("marketplace-products").getPublicUrl(path);
    const { error: imageError } = await ctx.supabase.from("marketplace_product_images").insert({ product_id: product.id, storage_bucket: "marketplace-products", storage_path: path, public_url: publicUrl.publicUrl, alt_text: title, sort_order: 0 });
    if (imageError) return { ok: false, message: "Product created, but its image record could not be saved." };
  }
  revalidatePath("/admin");
  revalidatePath("/marketplace");
  return { ok: true, message: "Product published to the marketplace." };
}

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