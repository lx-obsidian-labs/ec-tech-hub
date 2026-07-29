import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteUrl } from "@/lib/site-data";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "EC TECH HUB | Africa’s Trusted Technology Ecosystem",
  description: "Find technology repair support, verified technicians, trusted gadget listings, AI troubleshooting, digital services, and practical technology learning through EC TECH HUB.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "EC TECH HUB | Africa’s Trusted Technology Ecosystem",
    description: "Technology repair support, technician discovery, gadget listings, AI troubleshooting, digital services, and practical learning in one connected platform.",
    url: "/",
    siteName: "EC TECH HUB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EC TECH HUB | Africa’s Trusted Technology Ecosystem",
    description: "Find repair support, technicians, gadget listings, AI troubleshooting, digital services, and technology learning.",
  },
  robots: { index: true, follow: true },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "EC TECH HUB",
      url: siteUrl,
      description: "A technology ecosystem connecting users with repair support, technicians, gadget listings, AI troubleshooting, digital services, learning, and community knowledge.",
    },
    {
      "@type": "WebSite",
      name: "EC TECH HUB",
      url: siteUrl,
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geist.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </body>
    </html>
  );
}
