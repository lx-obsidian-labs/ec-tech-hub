import Link from "next/link";
import { quickActions } from "@/lib/site-data";
import { Icon, type IconName } from "@/components/ui/icon";

export function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-title" className="relative z-20 -mt-14 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <h2 id="quick-actions-title" className="sr-only">Primary platform actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group rounded-[22px] bg-white p-5 shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]">
              <span className="grid size-12 place-items-center rounded-[16px] bg-[var(--secondary-surface)] text-[var(--brand-blue)] transition group-hover:bg-[var(--blue-surface)]"><Icon name={action.icon as IconName} className="size-6" /></span>
              <span className="mt-5 block text-lg font-semibold tracking-[-0.02em] text-[var(--deep-navy)]">{action.title}</span>
              <span className="mt-2 block text-sm leading-6 text-[var(--secondary-text)]">{action.description}</span>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-blue)]">Open <Icon name="arrow" className="size-4 transition group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
