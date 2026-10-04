import { Link } from "@tanstack/react-router";
import { useI18n, useT } from "@/i18n";
import { HavatoPublicHeader, HavatoPublicFooter } from "./havato-public-chrome";
import { landingCopy } from "./havato-home-copy";
import "./havato-waitlist.css";

const storyCopy = {
  fa: {
    name: "ایده‌ای که نام گرفت",
    nameBody:
      "همه‌چیز از یک خواسته شروع شد: دوباره همان حسِ کنار هم بودن را بسازیم. آن ایده با گذشت زمان شکل گرفت و امروز نامش هواتو است. نام عوض شده، اما دلیل شروع همان است: هیچ‌کس نباید تنها بماند.",
    restartBody:
      "پس دوباره شروع کردم. بدون تیم و سرمایهٔ قبلی، من و برادرم محصول را از نو ساختیم. هواتوی امروز حاصل همان شروع دوباره است؛ با همان باور به ارزش دورهمی‌های واقعی.",
    closing:
      "دلیل وجود هواتو ساده است: هیچ‌کس نباید تنها بماند. می‌خواهیم پیدا کردن آدم‌های مناسب و کنار هم جمع شدن، بخش طبیعی زندگی روزمره باشد.",
    photoAlt: "جمعی کوچک دور یک میز کافه",
    chairAlt: "صندلی خالی کنار یک میز کافه",
  },
  en: {
    name: "The idea takes a name",
    nameBody:
      "It started with a wish to bring back that feeling of being together. The idea took shape over time, and today its name is Havato. The name has changed; the reason we began remains the same: no one should be alone.",
    restartBody:
      "So I started again. Without the old team or funding, my brother and I rebuilt the product. Havato today grew from that restart, with the same belief in the value of gathering in real life.",
    closing:
      "Havato exists for a simple reason: no one should be alone. We want finding the right people and getting together to feel like a natural part of everyday life.",
    photoAlt: "A small group around a café table",
    chairAlt: "An empty chair beside a café table",
  },
};

export function HavatoStory() {
  const { lang } = useI18n();
  const t = useT();
  const language = lang === "en" ? "en" : "fa";
  const c = storyCopy[language];
  const home = landingCopy[language];
  return (
    <div className="havato-public" lang={language} dir={language === "fa" ? "rtl" : "ltr"}>
      <a className="havato-skip" href="#havato-story-title">
        {home.skip}
      </a>
      <div className="havato-page">
        <HavatoPublicHeader story />
        <main className="havato-story">
          <header className="havato-story-heading">
            <p>{home.story}</p>
            <h1 id="havato-story-title" tabIndex={-1}>
              {t("ourStory.headline")}
            </h1>
          </header>
          <div className="havato-story-timeline">
            {Array.from({ length: 8 }, (_, index) => {
              const number = index + 1;
              const body =
                number === 4
                  ? c.nameBody
                  : number === 7
                    ? c.restartBody
                    : t(`ourStory.ch${number}.body`);
              return (
                <div key={number}>
                  <article className="havato-story-chapter">
                    <span className="havato-story-number" aria-hidden="true">
                      {number}
                    </span>
                    <div>
                      <h2>{number === 4 ? c.name : t(`ourStory.ch${number}.eyebrow`)}</h2>
                      {body
                        .split("\n")
                        .filter(Boolean)
                        .map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                    </div>
                  </article>
                  {number === 1 && <blockquote>“{t("ourStory.pullQuote")}”</blockquote>}
                  {(number === 3 || number === 7) && (
                    <figure>
                      <img
                        src={
                          number === 3
                            ? "/assets/our-story-friends-at-cafe.png"
                            : "/assets/our-story-empty-chair.png"
                        }
                        alt={number === 3 ? c.photoAlt : c.chairAlt}
                        width="1536"
                        height="1024"
                        loading="lazy"
                      />
                    </figure>
                  )}
                </div>
              );
            })}
          </div>
          <section
            className="havato-story-closing"
            aria-label={language === "fa" ? "رسالت هواتو" : "Havato’s mission"}
          >
            <p>{c.closing}</p>
            <p className="havato-story-signature">{t("ourStory.signature")}</p>
            <Link className="havato-cta" to="/" search={{ lang: language }} hash="waitlist">
              {home.requestAccess}
            </Link>
          </section>
        </main>
        <HavatoPublicFooter />
      </div>
    </div>
  );
}
