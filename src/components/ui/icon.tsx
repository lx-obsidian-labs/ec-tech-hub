import type { SVGProps } from "react";

const paths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  book: "M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5Zm4-12h6M8 11h6",
  check: "m5 12 4 4L19 6",
  device: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 15h4",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
  network: "M12 5v14M5 12h14M7 7l10 10M17 7 7 17",
  search: "m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
  shield: "M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm6 10 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z",
  tool: "M14.7 6.3a4 4 0 0 0-5 5L3.5 17.5a2.1 2.1 0 0 0 3 3l6.2-6.2a4 4 0 0 0 5-5l-2.8 2.8-2.1-2.1 2.9-2.7Z",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  pin: "M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  upload: "M12 16V4m-5 5 5-5 5 5M5 20h14",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5", ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d={paths[name]} />
    </svg>
  );
}
