export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Repair Hub", href: "/repairs" },
  { label: "Technicians", href: "/technicians" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Learn", href: "/learn" },
  { label: "AI Assist", href: "/ai-assist" },
] as const;

export const quickActions = [
  {
    title: "Request a Repair",
    description: "Describe the problem and prepare a repair request for a suitable provider.",
    href: "/repairs/new",
    icon: "tool",
  },
  {
    title: "Find a Technician",
    description: "Explore service categories and choose support that fits the device issue.",
    href: "/technicians",
    icon: "shield",
  },
  {
    title: "AI Troubleshooting",
    description: "Get structured safety-conscious checks before deciding what to do next.",
    href: "/ai-assist",
    icon: "spark",
  },
  {
    title: "Explore Marketplace",
    description: "Browse trusted technology categories and contact sellers directly.",
    href: "/marketplace",
    icon: "device",
  },
  {
    title: "Learn Technology",
    description: "Build practical skills in repair, AI, cybersecurity, software, and digital business.",
    href: "/learn",
    icon: "book",
  },
] as const;

export const serviceCategories = [
  "Phone repair",
  "Laptop repair",
  "Data recovery",
  "Networking",
  "CCTV",
  "Gaming consoles",
  "Software support",
  "Electronics",
] as const;

export const marketplaceCategories = [
  "Laptops",
  "Smartphones",
  "Desktop PCs",
  "Gaming",
  "Networking",
  "Printers",
  "Accessories",
  "Storage",
  "Components",
  "Monitors",
  "Audio",
  "Smart Home",
] as const;

export const learningTopics = [
  "Device repair basics",
  "Artificial intelligence",
  "Networking",
  "Cybersecurity awareness",
  "Software development",
  "Digital business",
  "Technology careers",
] as const;

export const digitalServices = [
  { title: "Website development", outcome: "Launch a clear, fast business presence." },
  { title: "Mobile applications", outcome: "Plan useful mobile tools for customers and teams." },
  { title: "AI integration", outcome: "Apply automation carefully to real workflows." },
  { title: "Business automation", outcome: "Reduce repeated admin and improve visibility." },
  { title: "Cloud support", outcome: "Set up reliable storage, collaboration, and backups." },
  { title: "SEO", outcome: "Make services easier to discover online." },
  { title: "Digital design", outcome: "Improve product, brand, and service experiences." },
  { title: "IT consulting", outcome: "Choose practical systems before spending money." },
] as const;

export const ecosystemZones = [
  { title: "Repair Hub", description: "Structured repair requests and issue details." },
  { title: "Technician Network", description: "Provider discovery with trust signals and service fit." },
  { title: "Marketplace", description: "Trusted catalogue categories with direct seller contact." },
  { title: "AI Assist", description: "Safety-conscious troubleshooting guidance." },
  { title: "Learning Hub", description: "Practical technology knowledge for everyday users." },
  { title: "Digital Services", description: "Business support for software, cloud, AI, and design." },
  { title: "Community", description: "Shared knowledge that improves technology access." },
] as const;
