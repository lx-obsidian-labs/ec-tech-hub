import { MarketplaceHome, type MarketplaceCategory, type MarketplaceHomeData, type MarketplaceImage, type MarketplaceProduct, type MarketplaceSeller } from "@/components/marketplace/marketplace-home";
import { marketplaceCategories } from "@/lib/site-data";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export const metadata = { title: "Technology Marketplace | EC TECH HUB", description: "Discover trusted technology products from verified sellers on EC TECH HUB." };

type SearchParams = { category?: string; q?: string; filter?: string; seller?: string; product?: string };
type ProductRow = Omit<MarketplaceProduct, "seller" | "images" | "isSaved"> & { seller_id: string };
type SellerRow = Omit<MarketplaceSeller, "productCount">;

const categoryMeta: Record<string, Pick<MarketplaceCategory, "icon" | "description">> = {
  Laptops: { icon: "device", description: "Portable computers, workstations, and notebooks." },
  Smartphones: { icon: "device", description: "Phones and mobile devices from trusted sellers." },
  "Desktop PCs": { icon: "network", description: "Office, creator, and performance desktop setups." },
  Gaming: { icon: "spark", description: "Gaming systems, accessories, and performance gear." },
  Networking: { icon: "network", description: "Routers, switches, Wi‑Fi, and connectivity products." },
  Printers: { icon: "tool", description: "Printers, scanners, and office print equipment." },
  Accessories: { icon: "spark", description: "Cases, adapters, cables, chargers, and add-ons." },
  Storage: { icon: "device", description: "SSDs, hard drives, memory cards, and backup media." },
  Components: { icon: "tool", description: "Parts, boards, memory, power supplies, and upgrades." },
  Monitors: { icon: "device", description: "Displays for work, learning, design, and gaming." },
  Audio: { icon: "spark", description: "Headphones, speakers, microphones, and audio gear." },
  "Smart Home": { icon: "network", description: "Connected home devices and automation equipment." },
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const category = params.category || "";
  const filter = params.filter || "";
  const sellerParam = params.seller || "";
  const selectedProductParam = params.product || "";
  const currentProfile = await getCurrentProfile();
  const supabase = await createClient();

  const baseCategories = marketplaceCategories.map((name) => normalizeCategory(String(name)));
  const fullCategoryNames = Array.from(new Set([...baseCategories, "Smartphones", "Desktop PCs", "Printers", "Storage", "Monitors", "Audio", "Smart Home"]));
  if (!supabase) return <Shell data={emptyData({ query, category, filter, isAuthenticated: Boolean(currentProfile), categories: fullCategoryNames })} />;

  const { products, sellers, images, savedIds } = await loadMarketplaceData({ supabase, query, category, filter, sellerParam, profileId: currentProfile?.id || null });
  const productCounts = countBy(products, "category");
  const sellerCounts = countBy(products, "seller_id");
  const sellerMap = new Map(sellers.map((seller) => [seller.id, { ...seller, productCount: sellerCounts.get(seller.id) || 0 }]));
  const imageMap = groupImages(images);
  const hydratedProducts: MarketplaceProduct[] = products.map((product) => ({ ...product, seller: sellerMap.get(product.seller_id) || null, images: imageMap.get(product.id) || [], isSaved: savedIds.has(product.id) })).filter((product) => product.seller?.verification_status === "approved");
  const verifiedSellers = Array.from(sellerMap.values()).filter((seller) => seller.verification_status === "approved" && seller.productCount > 0).slice(0, 6);
  const selectedProduct = selectedProductParam ? hydratedProducts.find((product) => product.id === selectedProductParam || product.slug === selectedProductParam) || null : null;
  const featured = hydratedProducts.filter((product) => product.is_featured).slice(0, 8);
  const recommended = hydratedProducts.filter((product) => product.isSaved).slice(0, 8);
  const recommendationFallback = recommended.length ? recommended : featured;
  const latest = [...hydratedProducts].sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()).slice(0, 12);
  const categories: MarketplaceCategory[] = fullCategoryNames.map((name) => ({ name, count: productCounts.get(name) || 0, icon: categoryMeta[name]?.icon || "device", description: categoryMeta[name]?.description || "Browse approved marketplace listings." }));

  return <Shell data={{ query, category, filter, products: hydratedProducts, featured, recommended: recommendationFallback, latest, sellers: verifiedSellers, categories, isAuthenticated: Boolean(currentProfile), savedCount: savedIds.size, resultCount: hydratedProducts.length, usedRecommendationFallback: recommended.length === 0, selectedProduct, selectedProductMissing: Boolean(selectedProductParam && !selectedProduct) }} />;
}

function Shell({ data }: { data: MarketplaceHomeData }) { return <main id="main-content" className="bg-[var(--page-bg)]"><section className="container-grid py-8 sm:py-10 lg:py-12"><MarketplaceHome data={data} /></section></main>; }

async function loadMarketplaceData({ supabase, query, category, filter, sellerParam, profileId }: { supabase: Awaited<ReturnType<typeof createClient>>; query: string; category: string; filter: string; sellerParam: string; profileId: string | null }) {
  if (!supabase) return { products: [] as ProductRow[], sellers: [] as SellerRow[], images: [] as MarketplaceImage[] & { product_id?: string }[], savedIds: new Set<string>() };
  let productQuery = supabase.from("marketplace_products").select("id,seller_id,title,slug,category,brand,model,short_description,condition,condition_notes,availability_status,location_city,location_province,price_amount,currency,show_price,is_featured,published_at,created_at").eq("status", "approved").order("is_featured", { ascending: false }).order("published_at", { ascending: false }).limit(80);
  if (category) productQuery = productQuery.eq("category", category);
  if (sellerParam) productQuery = productQuery.eq("seller_id", sellerParam);
  if (query) productQuery = productQuery.or(`title.ilike.%${escapeFilter(query)}%,brand.ilike.%${escapeFilter(query)}%,model.ilike.%${escapeFilter(query)}%,category.ilike.%${escapeFilter(query)}%,short_description.ilike.%${escapeFilter(query)}%`);
  const condition = conditionFromFilter(filter);
  if (condition) productQuery = productQuery.eq("condition", condition);
  if (["Laptops", "Gaming", "Networking"].includes(filter)) productQuery = productQuery.eq("category", filter);
  if (filter === "Nearby" && profileId) {
    const { data: profile } = await supabase.from("profiles").select("city,province").eq("id", profileId).maybeSingle();
    const city = typeof profile?.city === "string" ? profile.city : "";
    const province = typeof profile?.province === "string" ? profile.province : "";
    if (city) productQuery = productQuery.eq("location_city", city);
    else if (province) productQuery = productQuery.eq("location_province", province);
  }
  const { data: productRows, error: productError } = await productQuery;
  if (productError || !productRows) return { products: [] as ProductRow[], sellers: [] as SellerRow[], images: [] as (MarketplaceImage & { product_id?: string })[], savedIds: new Set<string>() };
  const products = productRows as ProductRow[];
  const productIds = products.map((product) => product.id);
  const sellerIds = Array.from(new Set(products.map((product) => product.seller_id)));
  const [sellerResult, imageResult, savedResult] = await Promise.all([
    sellerIds.length ? supabase.from("marketplace_sellers").select("id,display_name,logo_url,city,province,specialization,verification_status").in("id", sellerIds).eq("is_active", true).eq("verification_status", "approved") : Promise.resolve({ data: [] as SellerRow[], error: null }),
    productIds.length ? supabase.from("marketplace_product_images").select("id,product_id,public_url,alt_text,caption,sort_order").in("product_id", productIds).order("sort_order") : Promise.resolve({ data: [] as (MarketplaceImage & { product_id: string })[], error: null }),
    profileId && productIds.length ? supabase.from("marketplace_saved_products").select("product_id").eq("profile_id", profileId).in("product_id", productIds) : Promise.resolve({ data: [] as { product_id: string }[], error: null }),
  ]);
  const sellers = sellerResult.error || !sellerResult.data ? [] : sellerResult.data as SellerRow[];
  const images = imageResult.error || !imageResult.data ? [] : imageResult.data as (MarketplaceImage & { product_id: string })[];
  const savedIds = new Set((savedResult.error || !savedResult.data ? [] : savedResult.data as { product_id: string }[]).map((item) => item.product_id));
  return { products, sellers, images, savedIds };
}

function emptyData({ query, category, filter, isAuthenticated, categories }: { query: string; category: string; filter: string; isAuthenticated: boolean; categories: string[] }): MarketplaceHomeData {
  return { query, category, filter, products: [], featured: [], recommended: [], latest: [], sellers: [], categories: categories.map((name) => ({ name, count: 0, icon: categoryMeta[name]?.icon || "device", description: categoryMeta[name]?.description || "Browse approved marketplace listings." })), isAuthenticated, savedCount: 0, resultCount: 0, usedRecommendationFallback: true, selectedProduct: null, selectedProductMissing: false };
}

function normalizeCategory(value: string) { return value === "Phones" ? "Smartphones" : value === "Smart devices" ? "Smart Home" : value === "Refurbished technology" ? "Refurbished" : value; }
function conditionFromFilter(filter: string) { return ({ New: "new", Used: "used", Refurbished: "refurbished" } as Record<string, string>)[filter] || null; }
function escapeFilter(value: string) { return value.replace(/[%,]/g, ""); }
function countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) { const map = new Map<string, number>(); rows.forEach((row) => { const value = row[key]; if (typeof value === "string" && value) map.set(value, (map.get(value) || 0) + 1); }); return map; }
function groupImages(images: (MarketplaceImage & { product_id?: string })[]) { const map = new Map<string, MarketplaceImage[]>(); images.forEach(({ product_id, ...image }) => { if (!product_id) return; map.set(product_id, [...(map.get(product_id) || []), image]); }); return map; }