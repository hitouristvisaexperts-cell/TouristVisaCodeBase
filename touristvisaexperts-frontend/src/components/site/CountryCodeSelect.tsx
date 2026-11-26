import { ChevronDown } from "lucide-react";

// Dial codes offered on phone fields. India first (default), then the markets we serve most.
export const DIAL_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA / Canada" },
  { code: "+44", country: "United Kingdom" },
  { code: "+971", country: "UAE" },
  { code: "+61", country: "Australia" },
  { code: "+64", country: "New Zealand" },
  { code: "+65", country: "Singapore" },
  { code: "+974", country: "Qatar" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+965", country: "Kuwait" },
  { code: "+968", country: "Oman" },
  { code: "+973", country: "Bahrain" },
  { code: "+60", country: "Malaysia" },
  { code: "+49", country: "Germany" },
  { code: "+33", country: "France" },
  { code: "+39", country: "Italy" },
  { code: "+34", country: "Spain" },
  { code: "+31", country: "Netherlands" },
  { code: "+41", country: "Switzerland" },
  { code: "+353", country: "Ireland" },
  { code: "+27", country: "South Africa" },
  { code: "+81", country: "Japan" },
  { code: "+977", country: "Nepal" },
  { code: "+94", country: "Sri Lanka" },
  { code: "+880", country: "Bangladesh" },
];

export const DEFAULT_DIAL_CODE = "+91";

/** Joins a dial code and a local number into the single string we store/send, e.g. "+91 98765 43210". */
export const withDialCode = (code: string, number: string) => {
  const n = number.trim();
  if (!n) return "";
  return n.startsWith("+") ? n : `${code} ${n}`;
};

/**
 * Compact dial-code picker. A native <select> sits invisibly on top of the visible label,
 * so it stays narrow ("+91") while the open list shows full country names.
 */
export function CountryCodeSelect({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}) {
  return (
    <div className={`relative flex items-center gap-1 shrink-0 font-semibold ${className}`}>
      <span>{value}</span>
      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      <select
        aria-label="Country code"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {DIAL_CODES.map((d) => (
          <option key={d.code + d.country} value={d.code}>
            {d.country} ({d.code})
          </option>
        ))}
      </select>
    </div>
  );
}
