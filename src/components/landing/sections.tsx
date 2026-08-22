import { Link } from "@tanstack/react-router";
import {
  Compass,
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
  DoorOpen,
  Clock,
  Mountain,
  Gamepad2,
  Plus,
  HeartHandshake,
} from "lucide-react";
import type { ComponentType } from "react";
import { useT } from "@/i18n";
import { Reveal } from "@/components/landing/reveal";
import { TableDemo } from "@/components/landing/table-demo";
import { MatchingQuiz } from "@/components/landing/matching-quiz";



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
  { icon: DoorOpen, k: "s3" },
];

export function HowSection() {
  const t = useT();
  return (
    <section id="how" className="relative z-20 scroll-mt-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <Eyebrow>{t("landing.v4.how.eyebrow")}</Eyebrow>
          <SectionTitle>{t("landing.v4.how.title")}</SectionTitle>
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
                <h3 className="font-serif-warm mt-5 text-2xl font-bold tracking-tight text-white">
                  {t(`landing.v4.how.${s.k}.title`)}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[rgba(196,181,253,0.75)]">
                  {t(`landing.v4.how.${s.k}.body`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Categories ---------------- */

const CATEGORIES: { icon: ComponentType<{ className?: string }>; k: string }[] = [
  { icon: Coffee, k: "c1" },
  { icon: Mountain, k: "c2" },
  { icon: Gamepad2, k: "c3" },
  { icon: Plus, k: "c4" },
];

export function CategoriesSection() {
  const t = useT();
  return (
    <section id="categories" className="relative z-20 scroll-mt-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <Eyebrow>{t("landing.v4.categories.eyebrow")}</Eyebrow>
          <SectionTitle>{t("landing.v4.categories.title")}</SectionTitle>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.k} delay={i * 70}>
              <div className="cosmic-panel h-full p-6 text-start">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(245,208,138,0.15)] text-sunshine">
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="font-serif-warm mt-5 text-xl font-bold tracking-tight text-white">
                  {t(`landing.v4.categories.${c.k}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[rgba(196,181,253,0.75)]">
                  {t(`landing.v4.categories.${c.k}.body`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Upcoming (sample) ---------------- */

const UPCOMING = ["g1", "g2", "g3", "g4", "g5"] as const;
const UPCOMING_SEATS: Record<string, number> = { g1: 4, g2: 6, g3: 5, g4: 6, g5: 4 };

export function UpcomingSection() {
  const t = useT();
  return (
    <section id="gatherings" className="relative z-20 scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="max-w-2xl">
          <SectionTitle>{t("landing.v4.upcoming.title")}</SectionTitle>
          <p className="mt-3 text-base text-[rgba(221,214,254,0.75)]">
            {t("landing.v4.upcoming.subtitle")}
          </p>
        </Reveal>
      </div>

      <Reveal delay={80}>
        <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-[max(1rem,calc((100%-72rem)/2))]">
          {UPCOMING.map((k) => (
            <article
              key={k}
              className="cosmic-panel w-[260px] shrink-0 snap-start p-5 text-start sm:w-[300px]"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[rgba(196,181,253,0.72)]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {t(`landing.v4.upcoming.${k}.city`)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {t(`landing.v4.upcoming.${k}.when`)}
                </span>
              </div>
              <h3 className="font-serif-warm mt-4 text-lg font-semibold leading-snug text-white">
                {t(`landing.v4.upcoming.${k}.activity`)}
              </h3>
              <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] font-medium text-sunshine">
                <Users className="h-3.5 w-3.5" />
                {t("landing.v4.upcoming.seats", { n: UPCOMING_SEATS[k] })}
              </div>
            </article>
          ))}
        </div>
      </Reveal>

      <div className="mx-auto max-w-6xl px-4">
        <p className="mt-4 text-xs text-[rgba(196,181,253,0.55)]">
          {t("landing.v4.upcoming.footnote")}
        </p>
      </div>
    </section>
  );
}

/* ---------------- Differentiation ---------------- */

export function DiffSection() {
  const t = useT();
  return (
    <section id="why" className="relative z-20 scroll-mt-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <h2 className="font-serif-warm animate-headline-glow text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {t("landing.v4.diff.title")}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[rgba(221,214,254,0.8)] sm:text-lg">
            {t("landing.v4.diff.body")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Safety ---------------- */

export function SafetySection() {
  const t = useT();
  return (
    <section className="relative z-20 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-center sm:p-12">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.22)] text-[#C4B5FD]">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <h2 className="font-serif-warm mt-5 text-2xl font-semibold leading-snug text-white sm:text-3xl">
              {t("landing.v4.safety.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[rgba(221,214,254,0.8)]">
              {t("landing.v4.safety.body1")}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[rgba(196,181,253,0.7)]">
              {t("landing.v4.safety.body2")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}



/* ---------------- Matching ---------------- */

const CHIPS: { icon: ComponentType<{ className?: string }>; k: string }[] = [
  { icon: DoorOpen, k: "chip1" },
  { icon: Users, k: "chip2" },
  { icon: Clock, k: "chip3" },
];

export function MatchingSection() {
  const t = useT();
  return (
    <section id="matching" className="relative z-20 scroll-mt-20 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl text-center sm:text-start">
          <Eyebrow>{t("landing.v3.matching.eyebrow")}</Eyebrow>
          <SectionTitle>{t("landing.v3.matching.title")}</SectionTitle>
          <p className="mt-4 text-base leading-relaxed text-[rgba(221,214,254,0.75)]">
            {t("landing.v3.matching.subtitle")}
          </p>
        </Reveal>

        <Reveal delay={70}>
          <MatchingQuiz />
        </Reveal>

        <Reveal delay={210}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {CHIPS.map((chip) => (
              <div
                key={chip.k}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-[rgba(221,214,254,0.85)]"
              >
                <chip.icon className="h-4 w-4 text-sunshine" />
                {t(`landing.v3.matching.${chip.k}`)}
              </div>
            ))}
          </div>
        </Reveal>
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
          <div className="cosmic-panel px-6 py-16 text-center sm:px-12">
            <h2 className="font-serif-warm animate-headline-glow text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
              {t("landing.v4.final.title")}
            </h2>
            <Link
              to="/waitlist"
              className="cosmic-cta mt-8 inline-flex items-center justify-center gap-2 rounded-full px-9 py-4 text-base font-semibold text-white"
            >
              {t("landing.v4.final.cta")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>

        </Reveal>
      </div>
    </section>
  );
}
