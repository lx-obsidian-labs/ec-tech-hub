import Link from "next/link";
import { navLinks } from "@/lib/site-data";
import { LogoMark } from "@/components/ui/logo";

const professionalLinks = [
  { label: "Join as Technician", href: "/join/technician" },
  { label: "Business Directory", href: "/services" },
  { label: "Digital Services", href: "/services" },
  { label: "Verification", href: "/verification" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Help", href: "/help" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[var(--footer-bg)] text-white">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <div className="inline-flex rounded-[18px] bg-white p-2"><LogoMark /></div>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">EC TECH HUB connects African technology users with repair support, trusted services, learning pathways, and responsible troubleshooting tools.</p>
        </div>
        <FooterColumn title="Platform" links={navLinks.filter((link) => link.href !== "/")} />
        <FooterColumn title="Professionals" links={professionalLinks} />
        <FooterColumn title="Company" links={companyLinks} />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-6 text-xs leading-6 text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p>© {year} EC TECH HUB. All rights reserved.</p>
          <p className="max-w-3xl">EC TECH HUB connects customers and independent providers. Payments and service arrangements may occur directly between parties unless otherwise stated.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={`${title}-${link.label}-${link.href}`}>
            <Link href={link.href} className="text-sm text-slate-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
