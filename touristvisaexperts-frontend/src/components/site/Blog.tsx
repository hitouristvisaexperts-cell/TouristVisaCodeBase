import { useRef, useEffect, useState } from "react";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/magicui/scroll-reveal";
import { useNavigation } from "@/context/NavigationContext";
import type { ArticleData } from "@/context/NavigationContext";
import { FALLBACK_ARTICLES } from "@/data/fallbackArticles";

const API_BASE = "https://shop.touristvisaexperts.com/api";

export const Blog = () => {
  const [posts, setPosts] = useState<ArticleData[]>([])
  const [loaded, setLoaded] = useState(false)
  const { openArticle, navigateTo } = useNavigation()

  useEffect(() => {
    fetch(`${API_BASE}/articles`)
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setPosts(json.data)
        } else {
          setPosts(FALLBACK_ARTICLES as ArticleData[])
        }
      })
      .catch(() => { setPosts(FALLBACK_ARTICLES as ArticleData[]) })
      .finally(() => setLoaded(true))
  }, []);

  const scroller = useRef<HTMLDivElement>(null);
  const next = () => {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    el.scrollBy({ left: (card?.offsetWidth ?? 280) + 16, behavior: "smooth" });
  };

  if (loaded && posts.length === 0) return null;

  return (
    <section className="relative bg-background py-12 sm:py-20">
      <div className="container mx-auto">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-8 sm:gap-10 lg:grid-cols-[320px_minmax(0,1fr)]">
          <ScrollReveal direction="left" delay={0} duration={700}>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">From Our Blog</span>
            <h2 className="mt-3 text-3xl font-bold text-navy md:text-4xl">
              Latest Articles & Insights
            </h2>
            <span className="mt-3 inline-block h-1 w-16 rounded-full bg-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Stay updated with the latest visa news, travel tips and destination guides.
            </p>
            <Button
              variant="navy"
              size="pill"
              className="mt-6"
              onClick={() => navigateTo('resources')}
            >
              View All Blogs <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          </ScrollReveal>

          <div className="relative min-w-0">
            <button
              onClick={next}
              aria-label="Next"
              className="absolute -right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-navy shadow-elevated transition hover:text-primary md:flex lg:-right-5"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <div
              ref={scroller}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {posts.map((p, i) => (
                <article
                  key={p._id || i}
                  data-card
                  className="group w-[260px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
                  onClick={() => openArticle(p)}
                >
                  <div className="h-40 overflow-hidden bg-muted">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        width={640}
                        height={512}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-4xl bg-muted">📰</div>
                    )}
                  </div>
                  <div className="p-5">
                    <div
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: p.tagColor || '#f97316' }}
                    >
                      {p.tag}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-navy group-hover:text-primary">
                      {p.title}
                    </h3>
                    {p.excerpt && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.excerpt}</p>
                    )}
                    <div className="mt-4 flex items-center gap-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      {p.date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          {p.date}
                        </span>
                      )}
                      {p.readTime && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {p.readTime}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};