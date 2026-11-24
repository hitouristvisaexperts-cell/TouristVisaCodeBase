import { Globe, Quote, Star, Plane } from "lucide-react";
import avatarRohit from "@/assets/avatar-rohit.jpg";
import avatarAnanya from "@/assets/avatar-ananya.jpg";
import avatarArjun from "@/assets/avatar-arjun.jpg";
import passportBg from "@/assets/passport-bg-cropped.jpg";

type Testimonial = {
  country: string;
  quote: string;
  name: string;
  city: string;
  avatar: string;
  stampDate: string;
  stampType: "DEPARTED" | "ARRIVED";
};

const testimonials: Testimonial[] = [
  {
    country: "USA",
    quote: "The team made my USA visa process so easy and stress-free. Got my visa in just a few days!",
    name: "Rohit Mehta",
    city: "Mumbai, India",
    avatar: avatarRohit,
    stampDate: "15 MAY 2026",
    stampType: "DEPARTED",
  },
  {
    country: "UK",
    quote: "Excellent service and guidance at every step. Highly recommended!",
    name: "Ananya Sharma",
    city: "Delhi, India",
    avatar: avatarAnanya,
    stampDate: "22 APR 2026",
    stampType: "ARRIVED",
  },
  {
    country: "CANADA",
    quote: "Professional, reliable and very responsive. Got my Canada visa without any hassle.",
    name: "Arjun Nair",
    city: "Bangalore, India",
    avatar: avatarArjun,
    stampDate: "10 JUN 2026",
    stampType: "DEPARTED",
  },
];

function TicketCard({ t }: { t: Testimonial }) {
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
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-passport-orange text-passport-orange" />
          ))}
        </div>
        <p className="mt-3 text-passport-navy-deep/85 leading-relaxed text-[15px]">{t.quote}</p>
      </div>

      <div className="border-t border-dashed border-passport-navy/20 mt-5 pt-4 flex items-end justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src={t.avatar} alt={t.name} loading="lazy" width={512} height={512} className="w-12 h-12 rounded-full object-cover ring-2 ring-passport-navy/10" />
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

export function PassportTestimonials() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto rounded-2xl p-8 md:p-14 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden bg-passport-cream">
        <img
          src={passportBg}
          alt=""
          aria-hidden="true"
          className="absolute inset-x-0 top-0 w-full h-[520px] md:h-full object-cover object-[left_top] md:object-top pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-passport-cream/35 pointer-events-none" />

        <div className="grid md:grid-cols-2 gap-8 relative z-10">
          {/* Left page */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <Globe className="w-7 h-7 text-passport-gold" />
              <span className="font-sans font-bold tracking-[0.2em] text-passport-gold text-lg">PASSPORT</span>
            </div>
            <h2 className="font-serif text-[44px] md:text-6xl font-black text-white mt-8 leading-[1.05] max-w-[270px] md:max-w-none">
              What Our<br />
              <span className="text-passport-orange">Clients</span><span className="md:hidden"><br /></span> Say
            </h2>
            <div className="w-16 h-1 bg-passport-orange mt-4 rounded-full" />
            <p className="text-white/70 mt-4 max-w-xs leading-relaxed">
              Real stories from travelers who trusted us with their journey.
            </p>

            {/* decorative plane */}
            <Plane className="absolute top-2 right-8 w-10 h-10 text-white/10 rotate-12" />
          </div>

          {/* Right page (stamps area) */}
          <div className="relative bg-passport-paper/10 rounded-lg min-h-[200px] hidden md:flex items-start justify-end p-4 gap-4">
            <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_30%_40%,white_2px,transparent_3px),radial-gradient(circle_at_70%_60%,white_2px,transparent_3px)] bg-[length:60px_60px]" />
            <div className="relative border-2 border-stamp-blue/70 text-stamp-blue rounded px-3 py-2 rotate-[8deg] bg-white/5">
              <p className="text-[10px] font-bold tracking-wider text-center">- DEPARTED -</p>
              <p className="text-sm font-bold text-center mt-0.5">20 MAY 2026</p>
              <p className="text-[10px] font-bold tracking-wider text-center">AIRPORT</p>
            </div>
            <div className="relative border-2 border-stamp-red/70 text-stamp-red rounded-full w-28 h-28 flex flex-col items-center justify-center rotate-[-6deg] bg-white/5 mt-12">
              <p className="text-[8px] font-bold tracking-wider">IMMIGRATION</p>
              <Plane className="w-4 h-4 my-0.5" />
              <p className="text-[10px] font-bold">ARRIVED</p>
              <p className="text-[10px] font-bold">05 APR 2026</p>
            </div>
          </div>
        </div>

        {/* Tickets row */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 relative z-10">
          {testimonials.map((t) => (
            <TicketCard key={t.country} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
