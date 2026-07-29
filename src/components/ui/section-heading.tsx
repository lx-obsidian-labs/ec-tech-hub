import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, children, align = "left" }: { eyebrow?: string; title: string; children?: ReactNode; align?: "left" | "center" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">{eyebrow}</p> : null}
      <h2 className="mt-3 text-balance text-3xl font-bold tracking-[-0.03em] text-[var(--deep-navy)] sm:text-4xl lg:text-[44px] lg:leading-[1.08]">{title}</h2>
      {children ? <p className="mt-5 text-pretty text-base leading-8 text-[var(--secondary-text)] sm:text-lg">{children}</p> : null}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[24px] bg-white p-8 shadow-[var(--shadow-soft)]">
      <p className="text-lg font-semibold text-[var(--deep-navy)]">{title}</p>
      <div className="mt-3 text-[15px] leading-7 text-[var(--secondary-text)]">{children}</div>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
