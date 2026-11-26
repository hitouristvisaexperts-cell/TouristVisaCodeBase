import { useState } from "react";
import { Star } from "lucide-react";
import type { Review } from "@/lib/testimonials";

/** Client photo on a review card; falls back to initials when there is no photo (or it fails to load). */
export function ReviewAvatar({ r, className }: { r: Review; className: string }) {
  const [broken, setBroken] = useState(false);
  if (r.avatar && !broken) {
    return (
      <img src={r.avatar} alt={r.name} loading="lazy" width={320} height={320} onError={() => setBroken(true)}
        className={`${className} rounded-full object-cover ring-2 ring-passport-navy/10 shrink-0`} />
    );
  }
  const initials = r.name.trim().split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
  return (
    <div aria-hidden="true"
      className={`${className} rounded-full bg-passport-navy text-white font-bold text-[13px] flex items-center justify-center ring-2 ring-passport-navy/10 shrink-0`}>
      {initials}
    </div>
  );
}

/** The client's star rating (1–5). */
export function ReviewStars({ rating, className }: { rating: number; className: string }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`${className} ${i < rating ? "fill-passport-orange text-passport-orange" : "text-passport-orange/40"}`} />
      ))}
    </>
  );
}
