import type { JSX } from "react";
import { cn } from "@/lib/utils";

type Country = "USA" | "UK" | "Canada" | "Australia" | "Schengen" | "UAE" | "Singapore" | "France";

const flags: Record<Country, JSX.Element> = {
  USA: (
    <svg viewBox="0 0 60 60" className="h-full w-full">
      <defs>
        <clipPath id="cUSA"><circle cx="30" cy="30" r="30" /></clipPath>
      </defs>
      <g clipPath="url(#cUSA)">
        <rect width="60" height="60" fill="#fff" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} y={i * 8.57} width="60" height="4.28" fill="#B22234" />
        ))}
        <rect width="26" height="30" fill="#3C3B6E" />
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 6 }).map((_, c) => (
            <circle key={`${r}-${c}`} cx={3 + c * 4} cy={3 + r * 5} r="0.9" fill="#fff" />
          )),
        )}
      </g>
    </svg>
  ),
  UK: (
    <svg viewBox="0 0 60 60" className="h-full w-full">
      <defs><clipPath id="cUK"><circle cx="30" cy="30" r="30" /></clipPath></defs>
      <g clipPath="url(#cUK)">
        <rect width="60" height="60" fill="#012169" />
        <path d="M0 0L60 60M60 0L0 60" stroke="#fff" strokeWidth="8" />
        <path d="M0 0L60 60M60 0L0 60" stroke="#C8102E" strokeWidth="4" />
        <path d="M30 0V60M0 30H60" stroke="#fff" strokeWidth="12" />
        <path d="M30 0V60M0 30H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  ),
  Canada: (
    <svg viewBox="0 0 60 60" className="h-full w-full">
      <defs><clipPath id="cCA"><circle cx="30" cy="30" r="30" /></clipPath></defs>
      <g clipPath="url(#cCA)">
        <rect width="15" height="60" fill="#D52B1E" />
        <rect x="15" width="30" height="60" fill="#fff" />
        <rect x="45" width="15" height="60" fill="#D52B1E" />
        <path d="M30 18l2 5 5-1-3 4 4 3-5 1 1 5-4-3-4 3 1-5-5-1 4-3-3-4 5 1z" fill="#D52B1E" />
      </g>
    </svg>
  ),
  Australia: (
    <svg viewBox="0 0 60 60" className="h-full w-full">
      <defs><clipPath id="cAU"><circle cx="30" cy="30" r="30" /></clipPath></defs>
      <g clipPath="url(#cAU)">
        <rect width="60" height="60" fill="#012169" />
        <rect width="30" height="30" fill="#012169" />
        <path d="M0 0L30 30M30 0L0 30" stroke="#fff" strokeWidth="3" />
        <path d="M15 0V30M0 15H30" stroke="#fff" strokeWidth="5" />
        <path d="M15 0V30M0 15H30" stroke="#C8102E" strokeWidth="3" />
        {[[42, 18], [50, 30], [42, 42], [34, 30], [50, 50]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" fill="#fff" />
        ))}
      </g>
    </svg>
  ),
  Schengen: (
    <svg viewBox="0 0 60 60" className="h-full w-full">
      <defs><clipPath id="cEU"><circle cx="30" cy="30" r="30" /></clipPath></defs>
      <g clipPath="url(#cEU)">
        <rect width="60" height="60" fill="#003399" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const x = 30 + Math.cos(a) * 18;
          const y = 30 + Math.sin(a) * 18;
          return <circle key={i} cx={x} cy={y} r="2" fill="#FFCC00" />;
        })}
      </g>
    </svg>
  ),
  UAE: (
    <svg viewBox="0 0 60 60" className="h-full w-full">
      <defs><clipPath id="cAE"><circle cx="30" cy="30" r="30" /></clipPath></defs>
      <g clipPath="url(#cAE)">
        <rect width="60" height="20" fill="#00732F" />
        <rect y="20" width="60" height="20" fill="#fff" />
        <rect y="40" width="60" height="20" fill="#000" />
        <rect width="18" height="60" fill="#FF0000" />
      </g>
    </svg>
  ),
  France: (
    <svg viewBox="0 0 60 60" className="h-full w-full">
      <defs><clipPath id="cFR"><circle cx="30" cy="30" r="30" /></clipPath></defs>
      <g clipPath="url(#cFR)">
        <rect width="20" height="60" fill="#002395" />
        <rect x="20" width="20" height="60" fill="#fff" />
        <rect x="40" width="20" height="60" fill="#ED2939" />
      </g>
    </svg>
  ),
  Singapore: (
    <svg viewBox="0 0 60 60" className="h-full w-full">
      <defs><clipPath id="cSG"><circle cx="30" cy="30" r="30" /></clipPath></defs>
      <g clipPath="url(#cSG)">
        <rect width="60" height="30" fill="#EF3340" />
        <rect y="30" width="60" height="30" fill="#fff" />
        <circle cx="20" cy="15" r="9" fill="#fff" />
        <circle cx="23" cy="15" r="9" fill="#EF3340" />
      </g>
    </svg>
  ),
};

export const FlagBadge = ({ country, className }: { country: Country; className?: string }) => (
  <div
    className={cn(
      "overflow-hidden rounded-full border-4 border-white shadow-lg ring-1 ring-black/5",
      className,
    )}
  >
    {flags[country]}
  </div>
);

export type { Country };