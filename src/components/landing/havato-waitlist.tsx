import { Link } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  Coffee,
  MapPin,
  ShieldCheck,
  Users,
  Mail,
  CalendarCheck,
  ClipboardCheck,
  Coins,
  NotebookPen,
  Camera,
  LockKeyhole,
  Utensils,
  Footprints,
  Gamepad2,
  Film,
  ShoppingBasket,
  Sparkles,
} from "lucide-react";
import { brand } from "@/config/brand";
import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { joinHavatoWaitlist } from "@/lib/havato-waitlist";
import { HavatoInstall } from "./havato-install";
import { landingCopy } from "./havato-home-copy";
import { HavatoPublicHeader, HavatoPublicFooter } from "./havato-public-chrome";
import "./havato-waitlist.css";

const copy = {
  fa: {
    first: "برای باهم بودن،",
    accent: "دورهمی پیدا کن",
    intro: "با آدم‌های مناسب، برای کارهایی که دوست داری.",
    name: "نام و نام خانوادگی",
    email: "ایمیل",
    join: "درخواست دسترسی زودهنگام",
    busy: "در حال ثبت…",
    agree: "۱۸ سال یا بیشتر دارم و با",
    terms: "شرایط استفاده",
    privacy: "حریم خصوصی",
    and: "و",
    consent: "موافقم.",
    done: "درخواست دسترسی‌ات ثبت شد",
    doneBody: "با گسترش ظرفیت هواتو، دعوت‌نامه را به ایمیلت می‌فرستیم.",
    existing: "این ایمیل از قبل در فهرست دسترسی زودهنگام ثبت شده است.",
    failed: "ثبت انجام نشد. لطفاً دوباره تلاش کن.",
    valid: "نام و یک ایمیل معتبر وارد کن و شرایط را بپذیر.",
  },
  en: {
    first: "Make time to",
    accent: "get together.",
    intro: "With the right people, for the things you love.",
    name: "Full name",
    email: "Your email",
    join: "Request Early Access",
    busy: "Sending request…",
    agree: "I am 18 or over and agree to the",
    terms: "Terms",
    privacy: "Privacy Policy",
    and: "and",
    consent: ".",
    done: "Your access request is confirmed",
    doneBody: "We’ll invite you by email as access expands.",
    existing: "This email is already on the Early Access list.",
    failed: "We couldn’t save your details. Please try again.",
    valid: "Enter your name and a valid email, and accept the terms.",
  },
};
const trustIcons = [MapPin, ShieldCheck, Users];
const featureIcons = [Mail, CalendarCheck, ClipboardCheck, Coins, NotebookPen, Camera];
const activityIcons = [Coffee, Utensils, Footprints, Gamepad2, Film, ShoppingBasket, Sparkles];

export function HavatoWaitlist() {
  const { lang } = useI18n();
  const language = lang === "en" ? "en" : "fa";
  const c = copy[language];
  const home = landingCopy[language];
  const [form, setForm] = useState({ name: "", email: "" });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"joined" | "existing" | null>(null);
  const [error, setError] = useState<"valid" | "failed" | null>(null);
  const submitting = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError(null);
    if (!agree || !form.name.trim()) {
      setError("valid");
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      setDone(await joinHavatoWaitlist(form, (row) => supabase.from("waitlist").insert(row)));
    } catch {
      setError("failed");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="havato-public" lang={language} dir={language === "fa" ? "rtl" : "ltr"}>
      <a className="havato-skip" href="#havato-title">
        {home.skip}
      </a>
      <div className="havato-page">
        <HavatoPublicHeader />
        <main className="havato-main">
          <section className="havato-hero" aria-labelledby="havato-title">
            <div className="havato-hero-photo" aria-hidden="true">
              <img
                src="/assets/havato-home-cafe.webp"
                alt=""
                width="1536"
                height="1024"
                fetchPriority="high"
              />
            </div>
            <div className="havato-copy" dir={language === "fa" ? "rtl" : "ltr"}>
              <h1 id="havato-title" tabIndex={-1}>
                <span>{c.first}</span>
                <span className="havato-accent">{c.accent}</span>
              </h1>
              <p className="havato-intro">{c.intro}</p>
              <div className="havato-waitlist-card" id="waitlist">
                <h2>{home.joinTitle}</h2>
                <p id="waitlist-note">{home.joinNote}</p>
                {done ? (
                  <div className="havato-confirmation" role="status">
                    <Check size={30} />
                    <h2>{c.done}</h2>
                    <p>{done === "existing" ? c.existing : c.doneBody}</p>
                    <p dir="ltr">{form.email.trim()}</p>
                  </div>
                ) : (
                  <form
                    onSubmit={submit}
                    className="havato-form"
                    aria-busy={busy}
                    aria-describedby="waitlist-note"
                  >
                    <div className="havato-fields">
                      <label>
                        <span>{c.name}</span>
                        <input
                          id="waitlist-name"
                          name="name"
                          autoComplete="name"
                          required
                          maxLength={80}
                          placeholder={c.name}
                          value={form.name}
                          onChange={(event) => setForm({ ...form, name: event.target.value })}
                          disabled={busy}
                        />
                      </label>
                      <label>
                        <span>{c.email}</span>
                        <input
                          name="email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          required
                          maxLength={255}
                          placeholder={c.email}
                          value={form.email}
                          onChange={(event) => setForm({ ...form, email: event.target.value })}
                          disabled={busy}
                        />
                      </label>
                    </div>
                    <label className="havato-consent">
                      <input
                        type="checkbox"
                        required
                        checked={agree}
                        onChange={(event) => setAgree(event.target.checked)}
                        disabled={busy}
                      />
                      <span>
                        {c.agree}{" "}
                        <Link to="/terms" search={{ lang: language }}>
                          {c.terms}
                        </Link>{" "}
                        {c.and}{" "}
                        <Link to="/privacy" search={{ lang: language }}>
                          {c.privacy}
                        </Link>
                        {language === "fa" ? " " : ""}
                        {c.consent}
                      </span>
                    </label>
                    <button className="havato-cta" type="submit" disabled={busy}>
                      {busy ? c.busy : c.join}
                      <ArrowRight size={21} aria-hidden="true" />
                    </button>
                    {error && (
                      <p role="alert" className="havato-error">
                        {c[error]}
                      </p>
                    )}
                  </form>
                )}

                <p className="havato-private">
                  <LockKeyhole size={14} aria-hidden="true" />
                  {home.private}
                </p>
              </div>
            </div>
          </section>
          <section
            className="havato-use-cases havato-section"
            id="about"
            aria-labelledby="use-cases-title"
          >
            <h2 id="use-cases-title">
              {home.withWho} <span>{home.gathering}</span> {home.withWhoEnd}
            </h2>
            <div className="havato-case-grid">
              {home.cases.map((item, index) => (
                <article className="havato-case" key={item.title}>
                  <div className="havato-case-art" aria-hidden="true">
                    <img
                      src={
                        index === 0
                          ? "/assets/havato-home-family.webp"
                          : "/assets/havato-home-friends.webp"
                      }
                      alt=""
                      width="768"
                      height="512"
                      loading="lazy"
                    />
                  </div>
                  <div className="havato-case-copy">
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section
            className="havato-tools havato-section"
            id="how-it-works"
            aria-labelledby="tools-title"
          >
            <h2 className="havato-sr-only" id="tools-title">
              {home.toolsTitle}
            </h2>
            <ul className="havato-feature-strip">
              {home.features.map((label, index) => {
                const Icon = featureIcons[index];
                return (
                  <li key={label}>
                    <Icon aria-hidden="true" size={25} />
                    <span>{label}</span>
                  </li>
                );
              })}
            </ul>
            <p className="havato-feature-note">{home.featureNote}</p>
          </section>
          <section className="havato-trust havato-section" aria-label={home.trustTitle}>
            {home.trust.map(([title, body], index) => {
              const Icon = trustIcons[index];
              return (
                <div key={title}>
                  <span className="havato-trust-icon">
                    <Icon size={28} aria-hidden="true" />
                  </span>
                  <p>
                    <strong>{title}</strong>
                    <span>{body}</span>
                  </p>
                </div>
              );
            })}
          </section>
          <section className="havato-activities havato-section" aria-labelledby="activities-title">
            <h2 id="activities-title">
              <span>{language === "fa" ? "هواتو" : brand.name}</span> {home.activitiesTitle}
            </h2>
            <ul className="havato-activity-grid">
              {home.activities.map((label, index) => {
                const Icon = activityIcons[index];
                return (
                  <li key={label}>
                    <div className="havato-activity">
                      <span
                        className={`havato-activity-photo activity-${index}`}
                        aria-hidden="true"
                      />
                      <span className="havato-activity-caption">
                        <Icon size={19} aria-hidden="true" />
                        {label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="havato-faq havato-section" id="faq" aria-labelledby="faq-title">
            <h2 id="faq-title">{home.faqTitle}</h2>
            {home.faq.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </section>
          <div className="havato-access havato-section">
            <HavatoInstall />
          </div>
        </main>
        <HavatoPublicFooter />
      </div>
    </div>
  );
}
