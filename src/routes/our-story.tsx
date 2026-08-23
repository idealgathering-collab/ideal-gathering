import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/landing/public-header";
import { CosmicBackdrop } from "@/components/cosmic-backdrop";
import { SiteFooter } from "@/components/site-footer";
import { useT } from "@/i18n";
import { localizedHead, type SeoLang } from "@/lib/seo";
import friendsAtCafeAsset from "@/assets/our-story-friends-at-cafe.png.asset.json";
import emptyChairAsset from "@/assets/our-story-empty-chair.png.asset.json";

export const Route = createFileRoute("/our-story")({
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "tr" || search.lang === "fa" ? { lang: search.lang } : {},
  head: ({ match }) => localizedHead("/our-story", match.search.lang),
  component: OurStoryPage,
});



function OurStoryPage() {
  const t = useT();

  return (
    <div className="landing-dark cosmic-scene relative z-0 min-h-screen overflow-hidden bg-background">
      <PublicHeader anchors={[]} />
      <CosmicBackdrop />

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-24 pt-28 sm:pb-28 sm:pt-32">
        {/* Page header */}
        <header className="mb-16 sm:mb-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-tangerine">
            {t("ourStory.eyebrow")}
          </p>
          <h1 className="font-serif-warm text-4xl leading-[1.1] text-white sm:text-5xl">
            {t("ourStory.headline")}
          </h1>
        </header>

        {/* Chapter timeline */}
        <div className="relative">
          {/* Connecting vertical line */}
          <div
            className="absolute top-2 bottom-2 start-[19px] w-px bg-white/10 sm:start-[23px]"
            aria-hidden="true"
          />

          <Chapter number={1} contentKey={1} />

          {/* Pull quote */}
          <blockquote className="relative my-12 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 sm:my-16 sm:px-10 sm:py-10">
            <div
              className="absolute top-0 bottom-0 start-[19px] w-px bg-tangerine/30 sm:start-[23px]"
              aria-hidden="true"
            />
            <p className="relative z-10 font-serif-warm text-xl italic leading-relaxed text-white sm:text-2xl sm:leading-relaxed">
              “{t("ourStory.pullQuote")}”
            </p>
          </blockquote>

          <Chapter number={2} contentKey={2} />
          <Chapter number={3} contentKey={3} />

          {/* Image 1: friends at a café table */}
          <StoryImage
            src={friendsAtCafeAsset.url}
            alt="A small group of friends talking around a candlelit café table"
          />

          <Chapter number={4} contentKey={5} />
          <Chapter number={5} contentKey={6} />
          <Chapter number={6} contentKey={7} />

          {/* Image 2: empty chair pulled out */}
          <StoryImage
            src={emptyChairAsset.url}
            alt="A single empty chair pulled out from a warm café table"
          />

          <Chapter number={7} contentKey={8} />
        </div>

        {/* Closing */}
        <section className="mt-16 sm:mt-20">
          <p className="text-lg leading-8 text-foreground/90 sm:text-xl sm:leading-9">
            {t("ourStory.closing")}
          </p>
          <p className="mt-8 text-base font-medium text-foreground/70">
            {t("ourStory.signature")}
          </p>
          <div className="mt-10">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="cosmic-cta inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-white"
            >
              {t("ourStory.cta")}
            </Link>
          </div>
        </section>
      </main>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}

function Chapter({ number, contentKey }: { number: number; contentKey: number }) {
  const t = useT();
  const body = t(`ourStory.ch${contentKey}.body`);
  const paragraphs = body.split("\n").filter(Boolean);

  return (
    <article className="relative mb-12 sm:mb-16">
      {/* Circular badge */}
      <div
        className="absolute top-0 start-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] sm:h-12 sm:w-12"
      >
        <span className="text-sm font-bold text-white sm:text-base">{number}</span>
      </div>

      {/* Content */}
      <div className="ps-14 sm:ps-20">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-dark-secondary/80">
          {t(`ourStory.ch${contentKey}.eyebrow`)}
        </p>
        <div className="space-y-4 text-base leading-7 text-foreground/85 sm:text-lg sm:leading-8">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}

function StoryImage({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="relative my-12 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:my-16">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-40 w-full object-cover sm:h-44"
      />
    </figure>
  );
}
