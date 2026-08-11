import { Link } from "@tanstack/react-router";
import {
  Compass,
  Armchair,
  Coffee,
  Users,
  ShieldCheck,
  MapPin,
  Sparkles,
  Languages,
  Building2,
  MailCheck,
  Smartphone,
  Bot,
  ArrowRight,
} from "lucide-react";
import type { ComponentType } from "react";
import { useT } from "@/i18n";
import { Reveal } from "@/components/landing/reveal";
import { TableDemo } from "@/components/landing/table-demo";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[rgba(196,181,253,0.8)]">
      <Sparkles className="h-3 w-3 text-sunshine" />
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif-warm mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
      {children}
    </h2>
  );
}

/* ---------------- Demo ---------------- */

export function DemoSection() {
  const t = useT();
  return (
    <section id="demo" className="relative z-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <Eyebrow>{t("landing.v3.demo.eyebrow")}</Eyebrow>
          <SectionTitle>{t("landing.v3.demo.title")}</SectionTitle>
          <p className="mt-4 text-base leading-relaxed text-[rgba(221,214,254,0.75)]">
            {t("landing.v3.demo.body")}
          </p>
        </Reveal>
        <Reveal delay={80} className="mt-10">
          <TableDemo />
        </Reveal>
        <Reveal delay={140}>
          <p className="mt-6 text-xs text-[rgba(196,181,253,0.55)]">
            {t("landing.v3.demo.footnote")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */

const STEPS: { icon: ComponentType<{ className?: string }>; k: string }[] = [
  { icon: Compass, k: "s1" },
  { icon: Users, k: "s2" },
  { icon: Armchair, k: "s3" },
];

export function HowSection() {
  const t = useT();
  return (
    <section id="how" className="relative z-20 scroll-mt-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <Eyebrow>{t("landing.v3.how.eyebrow")}</Eyebrow>
          <SectionTitle>{t("landing.v3.how.title")}</SectionTitle>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.k} delay={i * 90}>
              <div className="cosmic-panel h-full p-6 text-start sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.22)] text-[#C4B5FD]">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-serif-warm text-3xl font-bold text-white/15">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-serif-warm mt-5 text-xl font-semibold text-white">
                  {t(`landing.v3.how.${s.k}.title`)}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[rgba(196,181,253,0.75)]">
                  {t(`landing.v3.how.${s.k}.body`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Problem ---------------- */

export function ProblemSection() {
  const t = useT();
  return (
    <section className="relative z-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <Eyebrow>{t("landing.v3.problem.eyebrow")}</Eyebrow>
          <h2 className="font-serif-warm animate-headline-glow mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {t("landing.v3.problem.title")}
          </h2>
        </Reveal>
        <Reveal delay={90}>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-[rgba(221,214,254,0.8)] sm:text-lg">
            {t("landing.v3.problem.p1")}
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[rgba(196,181,253,0.7)]">
            {t("landing.v3.problem.p2")}
          </p>
        </Reveal>
        <Reveal delay={160}>
          <p className="magic-glow-text mt-10 text-lg font-semibold uppercase tracking-[0.2em] sm:text-xl">
            {t("landing.v3.problem.quote")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Features ---------------- */

const FEATURES: { icon: ComponentType<{ className?: string }>; k: string }[] = [
  { icon: Sparkles, k: "f1" },
  { icon: Users, k: "f2" },
  { icon: ShieldCheck, k: "f3" },
  { icon: Coffee, k: "f4" },
];

export function FeaturesSection() {
  const t = useT();
  return (
    <section className="relative z-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <SectionTitle>{t("landing.v3.features.title")}</SectionTitle>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.k} delay={i * 70}>
              <div className="flex h-full items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(245,208,138,0.15)] text-sunshine">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif-warm text-lg font-semibold text-white">
                    {t(`landing.v3.features.${f.k}.title`)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[rgba(196,181,253,0.72)]">
                    {t(`landing.v3.features.${f.k}.body`)}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Venues ---------------- */

export function VenuesSection() {
  const t = useT();
  return (
    <section id="venues" className="relative z-20 scroll-mt-20 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 sm:p-10">
            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div>
                <Eyebrow>{t("landing.v3.venues.eyebrow")}</Eyebrow>
                <h2 className="font-serif-warm mt-4 text-2xl font-semibold text-white sm:text-3xl">
                  {t("landing.v3.venues.title")}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[rgba(196,181,253,0.75)]">
                  {t("landing.v3.venues.body")}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["b1", "b2", "b3"].map((b) => (
                    <span
                      key={b}
                      className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-[rgba(221,214,254,0.8)]"
                    >
                      {t(`landing.v3.venues.${b}`)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Link
                  to="/partnership"
                  className="cosmic-outline-btn inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium"
                >
                  {t("landing.v3.venues.cta")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link
                  to="/venue/auth"
                  className="text-sm text-[rgba(196,181,253,0.7)] underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {t("landing.v3.venues.cta2")}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Traction ---------------- */

const TRACTION: { icon: ComponentType<{ className?: string }>; k: string }[] = [
  { icon: Languages, k: "t1" },
  { icon: MapPin, k: "t2" },
  { icon: Building2, k: "t3" },
  { icon: MailCheck, k: "t4" },
  { icon: Smartphone, k: "t5" },
  { icon: Bot, k: "t6" },
];

export function TractionSection() {
  const t = useT();
  return (
    <section className="relative z-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <SectionTitle>{t("landing.v3.traction.title")}</SectionTitle>
          <p className="mt-3 text-sm text-[rgba(196,181,253,0.7)]">
            {t("landing.v3.traction.sub")}
          </p>
        </Reveal>
        <div className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {TRACTION.map((item, i) => (
            <Reveal key={item.k} delay={i * 55}>
              <div className="h-full bg-[rgba(12,7,26,0.75)] p-6">
                <item.icon className="h-5 w-5 text-sunshine" />
                <h3 className="font-serif-warm mt-4 text-base font-semibold text-white">
                  {t(`landing.v3.traction.${item.k}.title`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[rgba(196,181,253,0.7)]">
                  {t(`landing.v3.traction.${item.k}.body`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Vision ---------------- */

export function VisionSection() {
  const t = useT();
  return (
    <section id="vision" className="relative z-20 scroll-mt-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <Eyebrow>{t("landing.v3.vision.eyebrow")}</Eyebrow>
          <SectionTitle>{t("landing.v3.vision.title")}</SectionTitle>
          <p className="mt-6 text-base leading-relaxed text-[rgba(221,214,254,0.8)]">
            {t("landing.v3.vision.body")}
          </p>
          <p className="mt-4 text-base leading-relaxed text-[rgba(196,181,253,0.7)]">
            {t("landing.v3.vision.future")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */

export function FinalCtaSection() {
  const t = useT();
  return (
    <section className="relative z-20 px-4 pb-24 pt-10 sm:pb-32">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="cosmic-panel px-6 py-14 text-center sm:px-12">
            <h2 className="font-serif-warm text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              {t("landing.v3.final.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-[rgba(221,214,254,0.78)]">
              {t("landing.v3.final.body")}
            </p>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="cosmic-cta mt-8 inline-flex items-center justify-center gap-2 rounded-full px-9 py-4 text-base font-semibold text-white"
            >
              {t("landing.v3.final.cta")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <div className="mt-6 flex flex-col items-center gap-2 text-sm text-[rgba(196,181,253,0.65)]">
              <Link to="/auth" className="transition-colors hover:text-white">
                {t("landing.v3.final.login")}
              </Link>
              <Link to="/partnership" className="transition-colors hover:text-white">
                {t("landing.v3.final.venue")}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
