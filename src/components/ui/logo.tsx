import Image from "next/image";

export function LogoMark() {
  return (
    <span className="inline-flex h-[52px] items-center rounded-[14px] bg-[var(--deep-navy)] px-2.5 py-1.5 shadow-[0_10px_22px_rgba(11,18,32,0.18)]" aria-label="EC TECH HUB">
      <Image src="/images/ec-tech-hub-logo.png" alt="EC TECH HUB" width={350} height={94} sizes="(max-width: 640px) 140px, 168px" className="h-10 w-auto object-contain sm:h-11" priority />
    </span>
  );
}
