export function LogoMark() {
  return (
    <span className="flex items-center gap-3" aria-label="EC TECH HUB">
      <span className="relative grid size-10 place-items-center rounded-[14px] bg-[var(--brand-blue)] text-sm font-bold text-white shadow-[0_10px_22px_rgba(21,94,239,0.28)]">
        EC
        <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-[var(--trust-green)]" />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-bold tracking-[-0.01em] text-[var(--deep-navy)]">EC TECH HUB</span>
        <span className="block text-[11px] font-medium text-[var(--muted-text)]">Trusted technology ecosystem</span>
      </span>
    </span>
  );
}
