import Image from "next/image";

export function LogoMark() {
  return (
    <span className="inline-flex items-center rounded-[14px] bg-[var(--deep-navy)] px-2.5 py-1.5 shadow-[0_10px_22px_rgba(11,18,32,0.18)]" aria-label="EC TECH HUB">
      <Image src="/images/ec-tech-hub-logo.png" alt="EC TECH HUB" width={168} height={52} className="h-10 w-auto object-contain sm:h-11" priority />
    </span>
  );
}
