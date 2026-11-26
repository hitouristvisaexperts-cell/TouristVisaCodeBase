import { ArrowRight, Star } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { FlagBadge, type Country } from "./FlagBadge";
import { ScrollReveal } from "@/components/magicui/scroll-reveal";
import { useNavigation } from "@/context/NavigationContext";
import usa from "@/assets/dest-usa.jpg";
import uk from "@/assets/dest-uk.jpg";
import canada from "@/assets/dest-canada.jpg";
import australia from "@/assets/dest-australia.jpg";
import schengen from "@/assets/dest-schengen.jpg";
import france from "@/assets/dest-france.jpg";
import singapore from "@/assets/dest-singapore.jpg";

type Item = { country: Country; image: string; tagline: string; popular?: boolean; flag: string };

const items: Item[] = [
  // Order set by the client (Oct 2026)
  { country: "Schengen",  image: schengen,  tagline: "Travel across 29 European countries with one visa.",                    flag: '🇪🇺' },
  { country: "UK",        image: uk,        tagline: "Discover rich history and world-class education.",                       flag: '🇬🇧' },
  { country: "France",    image: france,    tagline: "Art, cuisine and the Eiffel Tower await.",                               flag: '🇫🇷' },
  { country: "USA",       image: usa,       tagline: "Explore iconic cities and endless opportunities.",        popular: true, flag: '🇺🇸' },
  { country: "Australia", image: australia, tagline: "Enjoy beautiful beaches and a high quality of life.",                    flag: '🇦🇺' },
  { country: "Canada",    image: canada,    tagline: "Experience stunning nature and vibrant cities.",                         flag: '🇨🇦' },
  { country: "Singapore", image: singapore, tagline: "A perfect blend of culture, innovation and lifestyle.",                  flag: '🇸🇬' },
];

export const Destinations = () => {
  const { openVisaDetails, openAllDestinations } = useNavigation()

  return (
    <section className="relative bg-gradient-hero py-20 pt-0 -mt-6">
      <div className="container mx-auto">
        <ScrollReveal direction="up" delay={0}>
          <SectionHeading
            title={<>Explore <span className="text-accent-purple">Top Destinations</span></>}
          />
        </ScrollReveal>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4">
          {items.map((it) => (
            <article
              key={it.country}
              className={`group relative overflow-hidden rounded-2xl border bg-card text-center shadow-card transition-all duration-300 hover:-translate-y-2 hover:shadow-elevated ${
                it.popular
                  ? "border-primary/40 ring-2 ring-primary/30 hover:ring-primary/60"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {it.popular && (
                <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-gradient-orange px-2 py-1 text-[10px] font-bold text-white shadow-orange sm:left-3 sm:top-3 sm:px-2.5">
                  <Star className="h-3 w-3 fill-current" />
                  Popular
                </span>
              )}
              <div className="relative h-28 w-full overflow-hidden sm:h-44">
                <img
                  src={it.image}
                  alt={`${it.country} skyline`}
                  width={640}
                  height={512}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="relative flex justify-center">
                <FlagBadge
                  country={it.country}
                  className="absolute -top-6 h-12 w-12 sm:-top-7 sm:h-14 sm:w-14"
                />
              </div>
              <div className="px-3 pb-4 pt-8 sm:px-4 sm:pb-5 sm:pt-10">
                <h3 className="text-base font-bold text-navy sm:text-lg">{it.country}</h3>
                <div className="mx-auto mt-1 h-0.5 w-8 rounded bg-primary/30" />
                <p className="mx-auto mt-2 min-h-[54px] text-[11px] leading-snug text-muted-foreground line-clamp-3 sm:mt-3 sm:min-h-[42px] sm:text-xs sm:leading-relaxed">
                  {it.tagline}
                </p>
                <button
                  onClick={() => openVisaDetails(it.country, it.flag)}
                  className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-bold transition sm:mt-5 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
                    "border border-orange-200 text-orange-600 hover:border-orange-500 hover:bg-orange-500 hover:text-white"
                  }`}
                >
                  Explore Visas <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}

          {/* 8th cell — jumps to the hero visa checker */}
          <article
            className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 sm:p-6 text-center transition-all hover:border-primary/60 hover:bg-primary/10 cursor-pointer"
            onClick={openAllDestinations}
          >
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-orange shadow-orange"
              style={{ boxShadow: "0 6px 20px rgba(249,115,22,0.35)" }}
            >
              <ArrowRight className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-base font-bold text-navy mb-2">Don't See Your Destination?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              Pick any country in the visa checker to see its requirements.
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-orange px-3 py-2 text-xs sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm font-bold text-white shadow-orange transition-transform group-hover:-translate-y-0.5">
              Check Requirements <ArrowRight className="h-4 w-4" />
            </span>
          </article>
        </div>
      </div>
    </section>
  )
};
