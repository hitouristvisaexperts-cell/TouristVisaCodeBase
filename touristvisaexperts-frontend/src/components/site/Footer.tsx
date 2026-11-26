import { MapPin } from "lucide-react";
import { useNavigation } from "../../context/NavigationContext";
import { CONTACT } from "../../lib/contact";
import { SOCIAL_LINKS } from "./SocialIcons";
const logo = "/logo.png";

const cols = [
  {
    title: "Quick Links",
    items: [
      { label: "Home", target: "home" },
      { label: "About Us", target: "about-us" },
      { label: "Services", target: "services" },
      { label: "Destinations", target: "all-visas" },
      { label: "Contact Us", target: "contact" },
    ],
  },
  {
    title: "Visa Services",
    items: [
      { label: "Tourist Visa", target: "visa-assistance" },
      { label: "Flight Reservation", target: "flight-reservation" },
      { label: "Refund & Cancellation Policy", target: "refund-policy" },
      { label: "Visa Rejected? Rebuild It Right", target: "rejected-visa" },
    ],
  },
  {
    title: "Top Destinations",
    items: [
      { label: "Schengen Visa", target: "Schengen", flag: "🇪🇺" },
      { label: "UK Visa", target: "UK", flag: "🇬🇧" },
      { label: "France Visa", target: "France", flag: "🇫🇷" },
      { label: "USA Visa", target: "USA", flag: "🇺🇸" },
      { label: "Australia Visa", target: "Australia", flag: "🇦🇺" },
      { label: "Canada Visa", target: "Canada", flag: "🇨🇦" },
    ],
  },
];

export const Footer = () => {
  const { navigateTo, openFlightReservation, openVisaDetails, openVisaAssistance } = useNavigation();
  return (
    <footer className="bg-gradient-navy text-white">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <img src={logo} alt="Tourist Visa Experts" className="h-12 w-auto brightness-0 invert" />
            <p className="mt-4 text-sm text-white/70">
              Expert visa assistance built on trust, reliability, and proven performance, wherever you're headed.
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-white/80">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-primary" /> {CONTACT.address}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">{c.title}</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-white/70">
                {c.items.map((i) => (
                  <li key={i.label}>
                    {c.title === "Top Destinations" ? (
                      <button
                        onClick={() => openVisaDetails(i.target, (i as { flag?: string }).flag ?? "🌍")}
                        className="transition-colors hover:text-primary text-left"
                      >
                        {i.label}
                      </button>
                    ) : i.target === "flight-reservation" ? (
                      <button
                        onClick={openFlightReservation}
                        className="transition-colors hover:text-primary text-left"
                      >
                        {i.label}
                      </button>
                    ) : i.target === "visa-assistance" ? (
                      <button
                        onClick={openVisaAssistance}
                        className="transition-colors hover:text-primary text-left"
                      >
                        {i.label}
                      </button>
                    ) : (
                      <button
                        onClick={() => navigateTo(i.target)}
                        className="transition-colors hover:text-primary text-left"
                      >
                        {i.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 sm:px-6 py-5 text-xs text-white/60 md:flex-row">
          <span>© {new Date().getFullYear()} Tourist Visa Experts. All rights reserved.</span>
          <div className="flex flex-wrap justify-center gap-5">
            <a href="/privacy" className="hover:text-primary">Privacy Policy</a>
            <a href="/terms" className="hover:text-primary">Terms of Service</a>
            <a href="/refund-policy" className="hover:text-primary">Refund &amp; Cancellation Policy</a>
            <a href="/disclaimer" className="hover:text-primary">Disclaimer</a>
            <a href="/data-retention" className="hover:text-primary">Data Retention</a>
          </div>
        </div>
      </div>
    </footer>
  );
};