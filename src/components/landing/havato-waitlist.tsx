import { Link } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Coffee, MapPin, ShieldCheck, Users } from "lucide-react";
import { brand, logoAsset } from "@/config/brand";
import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { joinHavatoWaitlist } from "@/lib/havato-waitlist";
import { HavatoInstall } from "./havato-install";
import "./havato-waitlist.css";

const copy = {
  fa: {
    first: "هر کاری که دلت می‌خواهد",
    accent: "با آدم‌های مناسب",
    last: "با هم انجام بده",
    intro:
      "هواتو به تو کمک می‌کند آدم‌های هم‌سلیقه پیدا کنی تا با هم به کافه بروید، غذا بخورید، گردش کنید و تجربه‌های تازه بسازید.",
    badge: "به‌زودی، از کافه‌های تهران",
    name: "نام و نام خانوادگی",
    email: "ایمیل شما",
    join: "در لیست انتظار بمان",
    busy: "در حال ثبت…",
    agree: "با",
    terms: "شرایط استفاده",
    privacy: "حریم خصوصی",
    and: "و",
    consent: "موافقم.",
    signin: "قبلاً ثبت‌نام کرده‌ای؟ ورود",
    venue: "کافه یا رستوران دارید؟",
    venueLink: "ورود مجموعه‌ها",
    community: "اولین دورهمی‌ها با شما شروع می‌شوند",
    note: "با باز شدن ظرفیت، خبرت می‌کنیم. ثبت‌نام در لیست انتظار رایگان است.",
    trust: [
      ["گروه‌های کوچک", "۲ تا ۵ نفر"],
      ["محیط امن", "تأیید و امکان گزارش"],
      ["دورهمی‌های واقعی", "در شهر تو"],
      ["آدم‌های هم‌سلیقه", "از کافه تا طبیعت"],
    ],
    done: "جایت در لیست انتظار محفوظ است",
    doneBody: "وقتی ظرفیت دعوت باز شود، از طریق ایمیل خبرت می‌کنیم.",
    existing: "این ایمیل از قبل در لیست انتظار است.",
    failed: "ثبت انجام نشد. لطفاً دوباره تلاش کن.",
    valid: "نام و یک ایمیل معتبر وارد کن و شرایط را بپذیر.",
    slogan: "تنها نباشیم",
    language: "زبان",
  },
  en: {
    first: "Whatever you love doing,",
    accent: "with the right people,",
    last: "do it together.",
    intro:
      "Find people who share your interests. Meet for coffee, share a meal, explore your city, and make new memories together.",
    badge: "Coming soon, starting with Tehran cafés",
    name: "Full name",
    email: "Your email",
    join: "Join the waitlist",
    busy: "Joining…",
    agree: "I agree to the",
    terms: "Terms",
    privacy: "Privacy Policy",
    and: "and",
    consent: ".",
    signin: "Already registered? Sign in",
    venue: "Run a café or restaurant?",
    venueLink: "Venue sign in",
    community: "The first gatherings start with you",
    note: "We’ll email you when invitations open. Joining the waitlist is free.",
    trust: [
      ["Small groups", "2–5 people"],
      ["Safer spaces", "Verification & reporting"],
      ["Real gatherings", "In your city"],
      ["Shared interests", "From cafés to nature"],
    ],
    done: "You’re on the waitlist",
    doneBody: "We’ll email you when invitations open.",
    existing: "This email is already on the waitlist.",
    failed: "We couldn’t save your details. Please try again.",
    valid: "Enter your name and a valid email, and accept the terms.",
    slogan: "Let’s not be alone",
    language: "Language",
  },
};
const trustIcons = [Users, ShieldCheck, MapPin, Coffee];

export function HavatoWaitlist() {
  const { lang, setLang } = useI18n();
  const language = lang === "en" ? "en" : "fa";
  const c = copy[language];
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
      <div className="havato-scene" aria-hidden="true">
        <img src="/assets/havato-autumn-desktop.webp" alt="" fetchPriority="high" />
      </div>
      <header className="havato-header">
        <Link to="/" aria-label={brand.name} className="havato-brand">
          <img src={logoAsset.url} alt="" />
          <span>{language === "fa" ? "هواتو" : brand.name}</span>
        </Link>
        <label className="havato-language">
          <span className="havato-sr-only">{c.language}</span>
          <select
            value={language}
            onChange={(event) => setLang(event.target.value === "en" ? "en" : "fa")}
          >
            <option value="fa">FA</option>
            <option value="en">EN</option>
          </select>
        </label>
      </header>
      <main className="havato-main">
        <section className="havato-copy" aria-labelledby="havato-title">
          <p className="havato-badge">
            <Coffee size={15} />
            {c.badge}
          </p>
          <h1 id="havato-title">
            <span>{c.first}</span>
            <span className="havato-accent">{c.accent}</span>
            <span>{c.last}</span>
          </h1>
          <p className="havato-intro">{c.intro}</p>
          <HavatoInstall />
          {done ? (
            <div className="havato-confirmation" role="status">
              <Check size={30} />
              <h2>{c.done}</h2>
              <p>{done === "existing" ? c.existing : c.doneBody}</p>
              <p dir="ltr">{form.email.trim()}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="havato-form" aria-busy={busy}>
              <div className="havato-fields">
                <label>
                  <span>{c.name}</span>
                  <input
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
                  {c.agree} <Link to="/terms">{c.terms}</Link> {c.and}{" "}
                  <Link to="/privacy">{c.privacy}</Link> {c.consent}
                </span>
              </label>
              <button className="havato-cta" type="submit" disabled={busy}>
                {busy ? c.busy : c.join}
                <ArrowRight size={21} />
              </button>
              {error && (
                <p role="alert" className="havato-error">
                  {c[error]}
                </p>
              )}
            </form>
          )}
          <div className="havato-community">
            <span className="havato-community-icon">
              <Users size={25} />
            </span>
            <div>
              <strong>{c.community}</strong>
              <p>{c.note}</p>
            </div>
          </div>
          <Link to="/auth" search={{ mode: "signin" }} className="havato-signin">
            {c.signin}
          </Link>
        </section>
        <section
          className="havato-trust"
          aria-label={language === "fa" ? "درباره دورهمی‌ها" : "About our gatherings"}
        >
          {c.trust.map(([title, body], index) => {
            const Icon = trustIcons[index];
            return (
              <div key={title}>
                <Icon size={29} />
                <strong>{title}</strong>
                <span>{body}</span>
              </div>
            );
          })}
        </section>
        <div className="havato-mobile-scene" aria-hidden="true">
          <img src="/assets/havato-autumn-mobile.webp" alt="" loading="lazy" />
          <span>{c.slogan}</span>
        </div>
      </main>
      <footer className="havato-footer">
        <p>
          {c.venue} <Link to="/venue/auth">{c.venueLink}</Link>
        </p>
        <nav aria-label={language === "fa" ? "قوانین" : "Legal"}>
          <Link to="/terms">{c.terms}</Link>
          <Link to="/privacy">{c.privacy}</Link>
        </nav>
        <small>
          © {new Date().getFullYear()} {brand.name}
        </small>
      </footer>
    </div>
  );
}
