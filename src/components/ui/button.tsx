import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: "primary" | "secondary" | "tertiary" | "dark";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

const variants = {
  primary: "bg-[var(--brand-blue)] text-white shadow-[0_10px_24px_rgba(21,94,239,0.22)] hover:bg-[var(--brand-blue-hover)] hover:-translate-y-px active:translate-y-0",
  secondary: "bg-white text-[var(--deep-navy)] shadow-[var(--shadow-soft)] hover:-translate-y-px hover:shadow-[var(--shadow-lift)] active:translate-y-0",
  tertiary: "bg-transparent text-[var(--brand-blue)] hover:bg-[var(--blue-surface)]",
  dark: "bg-[var(--deep-navy)] text-white shadow-[var(--shadow-soft)] hover:-translate-y-px hover:bg-[#111d31]",
};

const sizes = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-12 px-5 text-sm",
  lg: "min-h-14 px-6 text-base",
};

export function ButtonLink({ className = "", variant = "primary", size = "md", children, ...props }: ButtonProps) {
  return (
    <Link
      className={`inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
