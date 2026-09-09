/** Inline 24x24 stroke icons — no icon-library dependency, no extra request. */
import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: 16,
  height: 16,
  "aria-hidden": true,
  ...props,
});

export const Play = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 4.5 19 12 6 19.5z" fill="currentColor" stroke="none" /></svg>
);
export const Stop = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" /></svg>
);
export const Reset = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" /></svg>
);
export const Copy = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
);
export const Check = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m4 12.5 5.2 5.2L20 6.8" /></svg>
);
export const Cross = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 6 18 18M18 6 6 18" /></svg>
);
export const Terminal = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m5 7 5 5-5 5M13 17h6" /></svg>
);
export const ChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m9 5 7 7-7 7" /></svg>
);
export const ChevronLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m15 5-7 7 7 7" /></svg>
);
export const ChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m5 9 7 7 7-7" /></svg>
);
export const Sparkles = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18l-1.8-5.4L4.7 10.8 10.2 9zM18.5 3.5l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7zM6 15.5l.6 1.8 1.8.6-1.8.6L6 20.4l-.6-1.9-1.8-.6 1.8-.6z" /></svg>
);
export const Layers = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5" /></svg>
);
export const Grid = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></svg>
);
export const Table = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M10 10v10" /></svg>
);
export const Activity = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 12h4l3 8 4-16 3 8h4" /></svg>
);
export const Message = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" /></svg>
);
export const Search = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg>
);
export const Rocket = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 15c-1.5 1.5-2 6-2 6s4.5-.5 6-2c.9-.9.9-2.3 0-3.2a2.2 2.2 0 0 0-4 0zM9 15l-1-4 6-6a8 8 0 0 1 6-2 8 8 0 0 1-2 6l-6 6z" /><circle cx="15" cy="9" r="1.4" /></svg>
);
export const Sun = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2M12 20v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2 12h2M20 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" /></svg>
);
export const Moon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" /></svg>
);
export const Menu = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const Book = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></svg>
);
export const Bolt = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
);
export const Lock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
);
export const Lightbulb = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1 .9 1.6v.5h5.2v-.5c0-.6.3-1.1.9-1.6A6 6 0 0 0 12 3z" /></svg>
);
export const Github = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9 19c-4.5 1.5-4.5-2.5-6-3m12 5v-3.9c0-1.1.1-1.6-.6-2.2 3-.3 5.6-1.5 5.6-6a4.7 4.7 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.2 5.4 2.5 5.4 2.5a4.3 4.3 0 0 0-.1 3.2A4.7 4.7 0 0 0 4 8.9c0 4.5 2.6 5.7 5.6 6-.4.4-.6.9-.6 1.6V21" /></svg>
);

export const MODULE_ICONS = {
  sparkles: Sparkles,
  layers: Layers,
  grid: Grid,
  table: Table,
  activity: Activity,
  message: Message,
  search: Search,
  rocket: Rocket,
} as const;
