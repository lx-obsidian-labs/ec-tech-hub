export function LogoMark() {
  return (
    <span className="inline-flex h-[52px] min-w-[190px] items-center rounded-[14px] bg-[var(--deep-navy)] px-2.5 py-1.5 shadow-[0_10px_22px_rgba(11,18,32,0.18)]" aria-label="EC TECH HUB">
      {/* This is intentionally a direct public asset so it renders reliably on every deployment. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/ec-tech-hub-logo.png" alt="EC TECH HUB" width="350" height="94" className="block h-10 w-auto max-w-[190px] object-contain sm:h-11" />
    </span>
  );
}
