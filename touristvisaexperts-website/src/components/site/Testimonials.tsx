import { useEffect, useState } from "react";
import { Quote, Plane, ChevronLeft, ChevronRight } from "lucide-react";
import passportBg from "@/assets/passport-bg-cropped.jpg";
import { useReviews, type Review } from "@/lib/testimonials";
import { ReviewAvatar, ReviewStars } from "./ReviewAvatar";

const PAGE_SIZE_DESKTOP = 3;
const PAGE_SIZE_MOBILE = 1;

function TicketCard({ t }: { t: Review }) {
  const stampColor = t.stampType === "ARRIVED" ? "text-stamp-red border-stamp-red" : "text-stamp-blue border-stamp-blue";
  return (
    <div className="relative flex-1 bg-passport-cream rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] p-6 flex flex-col min-w-0">
      {/* perforated edge right */}
      <div className="hidden md:block absolute top-4 bottom-4 -right-[1px] w-[2px] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_4px,oklch(0.7_0.02_80)_4px,oklch(0.7_0.02_80)_8px)]" />

      <div className="text-center">
        <p className="font-sans font-bold text-stamp-blue tracking-[0.2em] text-sm">VISA APPROVED</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Plane className="w-3 h-3 text-stamp-blue" />
          <div className="flex-1 border-t border-dashed border-stamp-blue/40" />
          <p className="font-sans font-bold text-passport-orange tracking-[0.15em] text-base">{t.country}</p>
          <div className="flex-1 border-t border-dashed border-stamp-blue/40" />
          <Plane className="w-3 h-3 text-stamp-blue -scale-x-100" />
        </div>
      </div>

      <div className="mt-5 flex-1">
        <Quote className="w-7 h-7 text-stamp-blue fill-stamp-blue" />
        <div className="flex gap-0.5 mt-2">
          <ReviewStars rating={t.rating} className="w-4 h-4" />
        </div>
        <p className="mt-3 text-passport-navy-deep/85 leading-relaxed text-[16px]">{t.quote}</p>
      </div>

      <div className="border-t border-dashed border-passport-navy/20 mt-5 pt-4 flex flex-wrap md:flex-nowrap items-end justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-3 min-w-0">
          <ReviewAvatar r={t} className="w-12 h-12" />
          <div className="min-w-0">
            <p className="font-semibold text-passport-navy-deep text-sm truncate">{t.name}</p>
            <p className="text-xs text-passport-navy/60 truncate">{t.city}</p>
          </div>
        </div>
        <div className={`shrink-0 border-2 ${stampColor} rounded px-2 py-1 text-center rotate-[-4deg] bg-passport-cream/50`}>
          <p className="text-[8px] font-bold tracking-wider leading-tight">IMMIGRATION</p>
          <p className="text-[10px] font-bold leading-tight mt-0.5">{t.stampDate}</p>
          <p className="text-[8px] font-bold tracking-wider leading-tight flex items-center justify-center gap-1">
            {t.stampType} <Plane className="w-2 h-2" />
          </p>
        </div>
      </div>
    </div>
  );
}

export const Testimonials = () => {
  const testimonials = useReviews();
  const [page, setPage] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [isMobile, setIsMobile] = useState(false);

  useState(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  });

  const pageSize = isMobile ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;
  const totalPages = Math.max(1, Math.ceil(testimonials.length / pageSize));
  // the list can shrink when the live reviews arrive — stay on a page that exists
  useEffect(() => { if (page >= totalPages) setPage(0); }, [page, totalPages]);

  const go = (d: "next" | "prev") => {
    setDir(d);
    setPage((p) =>
      d === "next" ? (p + 1) % totalPages : (p - 1 + totalPages) % totalPages
    );
    setAnimKey((k) => k + 1);
  };

  const currentCards = testimonials.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <>
      <style>{`
        @keyframes pageFlipNext {
          0%   { transform: perspective(1200px) rotateY(0deg);   opacity: 1; }
          40%  { transform: perspective(1200px) rotateY(-88deg); opacity: 0.15; }
          60%  { transform: perspective(1200px) rotateY(88deg);  opacity: 0.15; }
          100% { transform: perspective(1200px) rotateY(0deg);   opacity: 1; }
        }
        @keyframes pageFlipPrev {
          0%   { transform: perspective(1200px) rotateY(0deg);  opacity: 1; }
          40%  { transform: perspective(1200px) rotateY(88deg); opacity: 0.15; }
          60%  { transform: perspective(1200px) rotateY(-88deg);opacity: 0.15; }
          100% { transform: perspective(1200px) rotateY(0deg);  opacity: 1; }
        }
        .flip-next { animation: pageFlipNext 0.6s cubic-bezier(0.4,0,0.2,1); }
        .flip-prev { animation: pageFlipPrev 0.6s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      <section className="py-10 sm:py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto rounded-2xl p-5 sm:p-8 md:p-14 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden bg-passport-cream">
          <img
            src={passportBg}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-[10%_top] md:object-top pointer-events-none select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-passport-cream/35 pointer-events-none" />

          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            {/* Left page */}
            <div className="relative">
              <h2 className="font-serif text-[36px] sm:text-[50px] md:text-[64px] font-black text-white leading-[1.02] max-w-[320px] md:max-w-none">
                What Our<br />
                <span className="text-passport-orange">Clients</span> Say
              </h2>

              <p className="font-serif font-bold text-white/75 mt-3 max-w-xs leading-relaxed text-[16px]">
                Real stories from travelers who trusted us with their journey.
              </p>

              {/* Real Travelers block — right below heading */}
              <div className="mt-3 mb-4">
                <p className="text-passport-orange font-black text-[15px] leading-snug mb-1">
                  ✦ Real Travelers, Real Solutions
                </p>
                <p className="text-white/60 leading-relaxed text-[13.5px] max-w-[300px]">
                  We've explored destinations across the globe and understand the complexities Indians face. Our expertise comes from experience, not just textbooks.
                </p>
              </div>

              <div className="w-16 h-1 bg-passport-orange rounded-full" />


              <Plane className="absolute top-2 right-8 w-10 h-10 text-white/10 rotate-12" />
            </div>

            {/* Right page (stamps area) */}
            <div className="relative bg-passport-paper/10 rounded-lg min-h-[200px] hidden md:flex items-start flex-wrap p-4 gap-3">
              <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_30%_40%,white_2px,transparent_3px),radial-gradient(circle_at_70%_60%,white_2px,transparent_3px)] bg-[length:60px_60px]" />

              {/* Stamp 1 — rectangular DEPARTED USA */}
              <div className="relative border-2 border-stamp-blue/70 text-stamp-blue rounded px-3 py-2 rotate-[8deg] bg-white/5 self-start mt-2">
                <p className="text-[9px] font-bold tracking-wider text-center">— DEPARTED —</p>
                <p className="text-[11px] font-bold text-center mt-0.5">20 MAY 2026</p>
                <p className="text-[9px] font-bold tracking-wider text-center">U.S.A.</p>
              </div>

              {/* Stamp 2 — oval ARRIVED UK */}
              <div className="relative border-2 border-stamp-red/70 text-stamp-red rounded-full w-24 h-24 flex flex-col items-center justify-center rotate-[-6deg] bg-white/5 mt-10">
                <p className="text-[7px] font-bold tracking-wider">IMMIGRATION</p>
                <Plane className="w-3 h-3 my-0.5" />
                <p className="text-[9px] font-bold">ARRIVED</p>
                <p className="text-[9px] font-bold">05 APR 2026</p>
                <p className="text-[7px] font-bold tracking-wider">U.K.</p>
              </div>

              {/* Stamp 3 — square ENTRY CANADA */}
              <div className="relative border-2 border-passport-gold/70 text-passport-gold rounded-sm px-3 py-2 rotate-[-10deg] bg-white/5 self-start mt-4">
                <p className="text-[9px] font-bold tracking-wider text-center">ENTRY</p>
                <p className="text-[11px] font-bold text-center">CANADA</p>
                <p className="text-[9px] font-bold tracking-wider text-center">10 JUN 2026</p>
                <p className="text-[8px] font-bold tracking-wider text-center opacity-70">VISITOR</p>
              </div>

              {/* Stamp 4 — circular SCHENGEN */}
              <div className="relative border-2 border-passport-orange/70 text-passport-orange rounded-full w-20 h-20 flex flex-col items-center justify-center rotate-[5deg] bg-white/5 mt-8">
                <p className="text-[7px] font-bold tracking-wider">✦ SCHENGEN ✦</p>
                <p className="text-[8px] font-bold mt-0.5">APPROVED</p>
                <p className="text-[7px] font-bold">18 JUL 2026</p>
              </div>

              {/* Stamp 5 — rectangular DUBAI DEPARTED */}
              <div className="relative border-2 border-stamp-red/60 text-stamp-red rounded px-2 py-1.5 rotate-[14deg] bg-white/5 self-end mb-2">
                <p className="text-[8px] font-bold tracking-wider text-center">✈ DUBAI ✈</p>
                <p className="text-[10px] font-bold text-center">DEPARTED</p>
                <p className="text-[8px] font-bold tracking-wider text-center">29 AUG 2026</p>
              </div>

              {/* Stamp 6 — oval JAPAN ENTRY */}
              <div className="relative border-2 border-stamp-blue/50 text-stamp-blue/80 rounded-full w-[86px] h-[86px] flex flex-col items-center justify-center rotate-[-12deg] bg-white/5 mt-2">
                <p className="text-[7px] font-bold tracking-widest">JAPAN</p>
                <p className="text-[8px] font-bold">ENTRY</p>
                <p className="text-[7px] font-bold mt-0.5">03 SEP 2026</p>
                <p className="text-[6px] font-bold tracking-wider opacity-70">IMMIGRATION</p>
              </div>

              {/* Stamp 7 — rectangular AUSTRALIA VISA */}
              <div className="relative border-2 border-passport-gold/60 text-passport-gold rounded px-3 py-1.5 rotate-[-7deg] bg-white/5 self-start mt-6">
                <p className="text-[8px] font-bold tracking-wider text-center">AUSTRALIA</p>
                <p className="text-[10px] font-bold text-center">VISITOR VISA</p>
                <p className="text-[8px] font-bold tracking-wider text-center opacity-80">12 OCT 2026</p>
              </div>

              {/* Stamp 8 — small square TRANSIT */}
              <div className="relative border-2 border-stamp-blue/60 text-stamp-blue rounded-sm px-2 py-1.5 rotate-[18deg] bg-white/5 self-end mb-4">
                <p className="text-[8px] font-bold tracking-wider text-center">TRANSIT</p>
                <p className="text-[9px] font-bold text-center">SINGAPORE</p>
                <p className="text-[7px] font-bold tracking-wider text-center opacity-70">07 NOV 2026</p>
              </div>

              {/* Stamp 9 — circular FRANCE APPROVED */}
              <div className="relative border-2 border-stamp-red/55 text-stamp-red/80 rounded-full w-[76px] h-[76px] flex flex-col items-center justify-center rotate-[9deg] bg-white/5 mt-4">
                <p className="text-[6px] font-bold tracking-wider">✦ FRANCE ✦</p>
                <p className="text-[8px] font-bold mt-0.5">APPROVED</p>
                <p className="text-[7px] font-bold">22 DEC 2026</p>
              </div>

              {/* Stamp 10 — rectangular NEW ZEALAND ENTRY */}
              <div className="relative border-2 border-passport-gold/65 text-passport-gold rounded px-3 py-1.5 rotate-[-15deg] bg-white/5 self-start mt-3">
                <p className="text-[8px] font-bold tracking-wider text-center">NEW ZEALAND</p>
                <p className="text-[10px] font-bold text-center">ENTRY PERMIT</p>
                <p className="text-[8px] font-bold tracking-wider text-center opacity-80">14 JAN 2027</p>
              </div>

              {/* Stamp 11 — oval GERMANY IMMIGRATION */}
              <div className="relative border-2 border-stamp-blue/60 text-stamp-blue rounded-full w-[90px] h-[70px] flex flex-col items-center justify-center rotate-[11deg] bg-white/5 mt-6">
                <p className="text-[7px] font-bold tracking-wider">GERMANY</p>
                <p className="text-[8px] font-bold">EINREISE</p>
                <p className="text-[7px] font-bold mt-0.5">08 FEB 2027</p>
              </div>

              {/* Stamp 12 — square THAILAND VISA */}
              <div className="relative border-2 border-passport-orange/65 text-passport-orange rounded-sm px-2 py-2 rotate-[-8deg] bg-white/5 self-end mb-3">
                <p className="text-[8px] font-bold tracking-wider text-center">✈ THAILAND ✈</p>
                <p className="text-[9px] font-bold text-center">TOURIST VISA</p>
                <p className="text-[7px] font-bold tracking-wider text-center opacity-80">02 MAR 2027</p>
              </div>

              {/* Stamp 13 — circular ITALY APPROVED */}
              <div className="relative border-2 border-stamp-red/60 text-stamp-red rounded-full w-[72px] h-[72px] flex flex-col items-center justify-center rotate-[-14deg] bg-white/5 mt-2">
                <p className="text-[6px] font-bold tracking-wider">✦ ITALY ✦</p>
                <p className="text-[8px] font-bold mt-0.5">VISTO</p>
                <p className="text-[7px] font-bold">19 APR 2027</p>
              </div>

              {/* Stamp 14 — rectangular SPAIN DEPARTED */}
              <div className="relative border-2 border-stamp-blue/55 text-stamp-blue rounded px-2 py-1.5 rotate-[20deg] bg-white/5 self-start mt-8">
                <p className="text-[8px] font-bold tracking-wider text-center">— SPAIN —</p>
                <p className="text-[10px] font-bold text-center">SALIDA</p>
                <p className="text-[8px] font-bold tracking-wider text-center opacity-80">30 MAY 2027</p>
              </div>
            </div>
          </div>

          {/* Cards row with arrows */}
          <div className="mt-8 relative z-10 flex items-center gap-3">
            <button
              onClick={() => go("prev")}
              aria-label="Previous"
              className="shrink-0 w-12 h-12 rounded-full bg-passport-navy text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-2 border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0" style={{ perspective: "1400px" }}>
              <div
                key={animKey}
                className={`flex flex-col md:flex-row gap-4 ${dir === "next" ? "flip-next" : "flip-prev"}`}
                style={{ transformStyle: "preserve-3d" }}
              >
                {currentCards.map((t) => (
                  <TicketCard key={t.id} t={t} />
                ))}
              </div>
            </div>

            <button
              onClick={() => go("next")}
              aria-label="Next"
              className="shrink-0 w-12 h-12 rounded-full bg-passport-navy text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-2 border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Page dots */}
          <div className="mt-5 flex justify-center gap-2 relative z-10">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setDir(i > page ? "next" : "prev"); setPage(i); setAnimKey((k) => k + 1); }}
                aria-label={`Page ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === page
                    ? "w-6 h-2.5 bg-passport-orange"
                    : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
