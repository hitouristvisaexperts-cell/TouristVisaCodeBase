import { useEffect, useState } from "react";
import { Quote, Plane, ChevronLeft, ChevronRight } from "lucide-react";
import passportBg from "@/assets/passport-bg-cropped.jpg";
import { useReviews, type Review } from "@/lib/testimonials";
import { ReviewAvatar, ReviewStars } from "./ReviewAvatar";

const PAGE_SIZE = 2;

function TicketCard({ t }: { t: Review }) {
  const stampColor = t.stampType === "ARRIVED" ? "text-stamp-red border-stamp-red" : "text-stamp-blue border-stamp-blue";
  return (
    <div className="relative flex-1 bg-passport-cream rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.13)] p-5 flex flex-col min-w-0">
      <div className="hidden sm:block absolute top-3 bottom-3 -right-[1px] w-[2px] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_4px,oklch(0.7_0.02_80)_4px,oklch(0.7_0.02_80)_8px)]" />
      <div className="text-center">
        <p className="font-sans font-bold text-stamp-blue tracking-[0.2em] text-[11px]">VISA APPROVED</p>
        <div className="flex items-center justify-center gap-2 mt-1.5">
          <Plane className="w-3 h-3 text-stamp-blue" />
          <div className="flex-1 border-t border-dashed border-stamp-blue/40" />
          <p className="font-sans font-bold text-passport-orange tracking-[0.12em] text-base">{t.country}</p>
          <div className="flex-1 border-t border-dashed border-stamp-blue/40" />
          <Plane className="w-3 h-3 text-stamp-blue -scale-x-100" />
        </div>
      </div>
      <div className="mt-3 flex-1">
        <Quote className="w-5 h-5 text-stamp-blue fill-stamp-blue" />
        <div className="flex gap-0.5 mt-1.5">
          <ReviewStars rating={t.rating} className="w-3.5 h-3.5" />
        </div>
        <p className="mt-2 text-passport-navy-deep/85 leading-relaxed text-[13px]">{t.quote}</p>
      </div>
      <div className="border-t border-dashed border-passport-navy/20 mt-3 pt-3 flex items-end justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ReviewAvatar r={t} className="w-9 h-9" />
          <div className="min-w-0">
            <p className="font-semibold text-passport-navy-deep text-[12px] truncate">{t.name}</p>
            <p className="text-[11px] text-passport-navy/60 truncate">{t.city}</p>
          </div>
        </div>
        <div className={`shrink-0 border-2 ${stampColor} rounded px-2 py-1 text-center rotate-[-4deg] bg-passport-cream/50`}>
          <p className="text-[8px] font-bold tracking-wider leading-tight">IMMIGRATION</p>
          <p className="text-[10px] font-bold leading-tight mt-0.5">{t.stampDate}</p>
          <p className="text-[8px] font-bold tracking-wider leading-tight flex items-center justify-center gap-0.5">
            {t.stampType} <Plane className="w-2 h-2" />
          </p>
        </div>
      </div>
    </div>
  );
}

export function VdPassportReviews() {
  const testimonials = useReviews();
  const totalPages = Math.max(1, Math.ceil(testimonials.length / PAGE_SIZE));
  const [page, setPage] = useState(0);
  // the list can shrink when the live reviews arrive — stay on a page that exists
  useEffect(() => { if (page >= totalPages) setPage(0); }, [page, totalPages]);
  const [animKey, setAnimKey] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");

  const go = (d: "next" | "prev") => {
    setDir(d);
    setPage((p) => (d === "next" ? (p + 1) % totalPages : (p - 1 + totalPages) % totalPages));
    setAnimKey((k) => k + 1);
  };

  const currentCards = testimonials.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <style>{`
        @keyframes vdPageFlipNext {
          0%   { transform: perspective(1000px) rotateY(0deg);   opacity: 1; }
          40%  { transform: perspective(1000px) rotateY(-88deg); opacity: 0.15; }
          60%  { transform: perspective(1000px) rotateY(88deg);  opacity: 0.15; }
          100% { transform: perspective(1000px) rotateY(0deg);   opacity: 1; }
        }
        @keyframes vdPageFlipPrev {
          0%   { transform: perspective(1000px) rotateY(0deg);  opacity: 1; }
          40%  { transform: perspective(1000px) rotateY(88deg); opacity: 0.15; }
          60%  { transform: perspective(1000px) rotateY(-88deg);opacity: 0.15; }
          100% { transform: perspective(1000px) rotateY(0deg);  opacity: 1; }
        }
        .vd-flip-next { animation: vdPageFlipNext 0.55s cubic-bezier(0.4,0,0.2,1); }
        .vd-flip-prev { animation: vdPageFlipPrev 0.55s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      <div className="rounded-2xl overflow-hidden relative bg-passport-cream shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)]" style={{ minHeight: '580px' }}>
        <img src={passportBg} alt="" aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none" />

        <div className="relative z-10">

          {/* ── Top: Heading (left) + Stamps (right) ── */}
          <div className="grid grid-cols-2">

            {/* Left — heading on dark passport page */}
            <div className="p-6 pb-4 pl-12 pt-10">
              <p className="text-passport-orange/80 text-[10px] font-black uppercase tracking-[0.25em] mb-2">Client Reviews</p>
              <h2 className="font-serif text-2xl font-black text-white leading-tight">
                What Our <span className="text-passport-orange">Clients</span> Say
              </h2>
              <div className="w-10 h-[3px] bg-passport-orange mt-2.5 rounded-full" />
              <p className="text-white/70 text-[12px] mt-2.5 leading-relaxed">
                Real stories from travelers who trusted us.
              </p>
            </div>

            {/* Right — stamps on white passport page */}
            <div className="pt-10 pb-4 pl-6 pr-4 flex items-start flex-wrap gap-3 overflow-hidden">

              {/* UK — oval ARRIVED */}
              <div className="shrink-0 border-[2.5px] border-stamp-red text-stamp-red rounded-full w-[60px] h-[60px] flex flex-col items-center justify-center rotate-[-6deg] bg-white/5 mt-3">
                <p className="text-[7px] font-black tracking-wide leading-none">IMMIGRATION</p>
                <Plane className="w-2.5 h-2.5 my-[3px]" />
                <p className="text-[9px] font-black leading-none">ARRIVED</p>
                <p className="text-[7px] font-bold leading-none mt-[2px]">22 APR 2026</p>
                <p className="text-[7px] font-black tracking-wide leading-none mt-[2px]">U.K.</p>
              </div>

              {/* CANADA — rectangular */}
              <div className="shrink-0 border-[2.5px] border-passport-gold text-passport-gold rounded px-2.5 py-1.5 rotate-[-9deg] bg-white/5 mt-5">
                <p className="text-[8px] font-black tracking-widest text-center leading-none">ENTRY</p>
                <p className="text-[12px] font-black text-center leading-tight mt-0.5">CANADA</p>
                <p className="text-[8px] font-bold tracking-wide text-center leading-none mt-0.5">10 JUN 2026</p>
              </div>

              {/* EU SCHENGEN — circular */}
              <div className="shrink-0 border-[2.5px] border-passport-orange text-passport-orange rounded-full w-[60px] h-[60px] flex flex-col items-center justify-center rotate-[5deg] bg-white/5 mt-6">
                <p className="text-[7px] font-black tracking-wide leading-none">✦ EU ✦</p>
                <p className="text-[9px] font-black leading-none mt-[3px]">APPROVED</p>
                <p className="text-[7px] font-bold leading-none mt-[2px]">18 JUL 2026</p>
              </div>

              {/* DUBAI — rectangular */}
              <div className="shrink-0 border-[2.5px] border-stamp-red text-stamp-red rounded px-2.5 py-1.5 rotate-[12deg] bg-white/5 mt-5">
                <p className="text-[8px] font-black tracking-wide text-center leading-none">✈ DUBAI ✈</p>
                <p className="text-[10px] font-black text-center leading-tight mt-0.5">DEPARTED</p>
                <p className="text-[8px] font-bold tracking-wide text-center leading-none mt-0.5">29 AUG 2026</p>
              </div>

              {/* JAPAN — circular */}
              <div className="shrink-0 border-[2.5px] border-stamp-blue text-stamp-blue rounded-full w-[60px] h-[60px] flex flex-col items-center justify-center rotate-[-8deg] bg-white/5 mt-1">
                <p className="text-[8px] font-black tracking-widest leading-none">JAPAN</p>
                <p className="text-[9px] font-black leading-none mt-[3px]">ENTRY</p>
                <p className="text-[7px] font-bold leading-none mt-[2px]">03 SEP 2026</p>
                <p className="text-[6px] font-bold tracking-wide opacity-60 leading-none mt-[2px]">IMMIGRATION</p>
              </div>

              {/* AUSTRALIA — rectangular */}
              <div className="shrink-0 border-[2.5px] border-passport-gold text-passport-gold rounded px-2.5 py-1.5 rotate-[-7deg] bg-white/5 mt-2">
                <p className="text-[8px] font-black tracking-wide text-center leading-none">AUSTRALIA</p>
                <p className="text-[10px] font-black text-center leading-tight mt-0.5">VISITOR VISA</p>
                <p className="text-[7px] font-bold tracking-wide text-center opacity-80 leading-none mt-0.5">12 OCT 2026</p>
              </div>

              {/* SINGAPORE — small rect */}
              <div className="shrink-0 border-[2.5px] border-stamp-blue text-stamp-blue rounded px-2.5 py-1.5 rotate-[16deg] bg-white/5 mt-1">
                <p className="text-[8px] font-black tracking-widest text-center leading-none">TRANSIT</p>
                <p className="text-[10px] font-black text-center leading-tight mt-0.5">SINGAPORE</p>
                <p className="text-[7px] font-bold tracking-wide text-center opacity-70 leading-none mt-0.5">07 NOV 2026</p>
              </div>

              {/* FRANCE — circular */}
              <div className="shrink-0 border-[2.5px] border-stamp-red text-stamp-red rounded-full w-[56px] h-[56px] flex flex-col items-center justify-center rotate-[9deg] bg-white/5 mt-3">
                <p className="text-[7px] font-black tracking-wide leading-none">✦ FRANCE ✦</p>
                <p className="text-[9px] font-black leading-none mt-[3px]">APPROVED</p>
                <p className="text-[7px] font-bold leading-none mt-[2px]">22 DEC 2026</p>
              </div>

            </div>
          </div>

          {/* ── Cards + arrows ── */}
          <div className="flex items-center gap-2 px-4 pb-4 mt-4">
            <button onClick={() => go("prev")} aria-label="Previous"
              className="shrink-0 w-8 h-8 rounded-full bg-passport-navy/80 hover:bg-passport-navy text-white flex items-center justify-center shadow transition-all hover:scale-110 active:scale-95 border border-white/10">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0" style={{ perspective: "1000px" }}>
              <div key={animKey}
                className={`flex flex-col sm:flex-row gap-3 ${dir === "next" ? "vd-flip-next" : "vd-flip-prev"}`}
                style={{ transformStyle: "preserve-3d" }}>
                {currentCards.map((t) => <TicketCard key={t.id} t={t} />)}
              </div>
            </div>

            <button onClick={() => go("next")} aria-label="Next"
              className="shrink-0 w-8 h-8 rounded-full bg-passport-navy/80 hover:bg-passport-navy text-white flex items-center justify-center shadow transition-all hover:scale-110 active:scale-95 border border-white/10">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* ── Dots ── */}
          <div className="pb-5 flex justify-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i}
                onClick={() => { setDir(i > page ? "next" : "prev"); setPage(i); setAnimKey((k) => k + 1); }}
                aria-label={`Page ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${i === page ? "w-5 h-2 bg-passport-orange" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
