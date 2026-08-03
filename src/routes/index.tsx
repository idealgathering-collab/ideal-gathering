import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import {
  UserPlus,
  Lock,
  Store,
  ClipboardCheck,
  CalendarDays,
  Compass,
  Armchair,
} from "lucide-react";
import { useT } from "@/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useSession } from "@/hooks/use-session";
import { useIsMobile } from "@/hooks/use-mobile";
import nebulaAsset from "@/assets/landing-nebula-skyline.jpg.asset.json";
import constellationAsset from "@/assets/constellation-people.png.asset.json";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Ideal Gathering — No one will be alone anymore" },
      {
        name: "description",
        content:
          "Curated conversations at Istanbul's best cafes. Join the table and turn strangers into friends.",
      },
      { property: "og:title", content: "Ideal Gathering" },
      {
        property: "og:description",
        content: "Curated conversations at Istanbul's best cafes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CrescentMark() {
  return (
    <img
      src={logoAsset.url}
      alt="Ideal Gathering logo"
      width={96}
      height={96}
      className="animate-emblem-glow h-14 w-14 rounded-full object-contain"
    />
  );
}


function Sparkle({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2l2.2 6.4L21 12l-6.8 2.6L12 22l-2.2-7.4L3 12l6.8-3.6L12 2Z" />
    </svg>
  );
}

function TeacupIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <path d="M4 9h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M17 10h1.6a2.4 2.4 0 0 1 0 4.8H17" />
      <path d="M3 21h16" />
      <path d="M11 3.2l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8L8.5 5.7l1.8-.7L11 3.2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function StepCard({
  number,
  icon: Icon,
  title,
  body,
  isLast,
}: {
  number: number;
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 text-start">
      <div className="flex flex-col items-center gap-1.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sunshine/90 text-[11px] font-bold text-sunshine-foreground">
          {number}
        </span>
        {!isLast && (
          <div className="h-10 w-px bg-gradient-to-b from-sunshine/50 to-transparent" aria-hidden />
        )}
      </div>
      <div className={`flex-1 ${isLast ? "" : "pb-6"}`}>
        <div className="mb-1.5 inline-flex items-center gap-2 text-sm font-semibold text-white">
          <Icon className="h-4 w-4 text-sunshine" />
          {title}
        </div>
        <p className="text-sm leading-relaxed text-[rgba(196,181,253,0.75)]">{body}</p>
      </div>
    </div>
  );
}

function HowItWorksSection() {
  const t = useT();
  return (
    <section className="relative z-20 w-full px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center sm:mb-14">
          <h2 className="font-serif-warm text-3xl font-semibold text-white sm:text-4xl">
            {t("landing.v2.how.title")}
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-sunshine/60 to-transparent" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Cafes */}
          <div className="cosmic-panel p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sunshine/15 text-sunshine">
                <Store className="h-5 w-5" />
              </span>
              <h3 className="font-display text-xl text-white">{t("landing.v2.how.cafes.title")}</h3>
            </div>
            <div className="flex flex-col">
              <StepCard
                number={1}
                icon={Store}
                title={t("landing.v2.how.cafes.step1.title")}
                body={t("landing.v2.how.cafes.step1.body")}
              />
              <StepCard
                number={2}
                icon={ClipboardCheck}
                title={t("landing.v2.how.cafes.step2.title")}
                body={t("landing.v2.how.cafes.step2.body")}
              />
              <StepCard
                number={3}
                icon={CalendarDays}
                title={t("landing.v2.how.cafes.step3.title")}
                body={t("landing.v2.how.cafes.step3.body")}
                isLast
              />
            </div>
          </div>

          {/* Guests */}
          <div className="cosmic-panel p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                <UserPlus className="h-5 w-5" />
              </span>
              <h3 className="font-display text-xl text-white">{t("landing.v2.how.guests.title")}</h3>
            </div>
            <div className="flex flex-col">
              <StepCard
                number={1}
                icon={UserPlus}
                title={t("landing.v2.how.guests.step1.title")}
                body={t("landing.v2.how.guests.step1.body")}
              />
              <StepCard
                number={2}
                icon={Compass}
                title={t("landing.v2.how.guests.step2.title")}
                body={t("landing.v2.how.guests.step2.body")}
              />
              <StepCard
                number={3}
                icon={Armchair}
                title={t("landing.v2.how.guests.step3.title")}
                body={t("landing.v2.how.guests.step3.body")}
                isLast
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function Home() {
  const t = useT();
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="landing-dark cosmic-scene relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  const stars = Array.from({ length: 80 }, (_, i) => {
    const seed = i * 9301 + 49297;
    return {
      x: seed % 100,
      y: (seed * 7) % 100,
      size: 1 + ((i * 5) % 3),
      delay: (i % 9) * 0.5,
      duration: 3 + (i % 5),
    };
  });

  const shootingStars = [
    { top: "8%", left: "-8%", delay: 2, duration: 7 },
    { top: "26%", left: "38%", delay: 9, duration: 8 },
    { top: "58%", left: "-12%", delay: 15, duration: 9 },
  ];

  const motes = Array.from({ length: 18 }, (_, i) => ({
    x: (i * 37) % 100,
    y: (i * 53) % 100,
    size: 2 + (i % 3),
    delay: (i % 7) * 1.1,
    duration: 6 + (i % 5),
  }));


  return (
    <div className="landing-dark cosmic-scene relative z-0 overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Nebula + Istanbul skyline backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center animate-bg-drift"
        style={{
          backgroundImage: `url(${nebulaAsset.url})`,
          inset: "-4%",
          willChange: "transform",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(10,6,22,0.25) 0%, rgba(10,6,22,0.7) 65%, rgba(10,6,22,0.92) 100%)",
        }}
      />

      {/* Twinkling starfield */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[8] overflow-hidden">
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full animate-star-twinkle"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background: i % 4 === 0 ? "#A78BFA" : "#EDE9FE",
              boxShadow: i % 4 === 0
                ? "0 0 10px rgba(167,139,250,1), 0 0 20px rgba(124,58,237,0.7)"
                : "0 0 8px rgba(237,233,254,0.95), 0 0 16px rgba(196,181,253,0.6)",
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Shooting stars */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[8] overflow-hidden">
        {shootingStars.map((s, i) => (
          <span
            key={i}
            className="animate-shooting-star absolute h-px w-[140px] rounded-full"
            style={{
              top: s.top,
              left: s.left,
              background:
                "linear-gradient(90deg, transparent, rgba(237,233,254,0.95), rgba(167,139,250,0.5), transparent)",
              boxShadow: "0 0 12px rgba(196,181,253,0.9)",
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Drifting sparkle motes */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[9] overflow-hidden">
        {motes.map((m, i) => (
          <span
            key={i}
            className="animate-sparkle-drift absolute rounded-full"
            style={{
              left: `${m.x}%`,
              top: `${m.y}%`,
              width: `${m.size}px`,
              height: `${m.size}px`,
              background: i % 3 === 0 ? "#F5D08A" : "#DDD6FE",
              boxShadow: "0 0 12px rgba(196,181,253,0.9)",
              animationDelay: `${m.delay}s`,
              animationDuration: `${m.duration}s`,
            }}
          />
        ))}
      </div>



      {/* Hero */}
      <section className="relative z-10 flex min-h-[100dvh] items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-[440px]">
          {/* Aura behind the glass panel */}
          <div
            aria-hidden
            className="cosmic-aura pointer-events-none absolute -inset-10 -z-10 rounded-[60px] blur-2xl"
            style={{
              background:
                "radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.45) 0%, rgba(167,139,250,0.22) 45%, transparent 72%)",
            }}
          />
          {/* Glass panel */}
          <div className="cosmic-panel relative flex w-full flex-col items-center overflow-hidden px-6 py-6 text-center sm:px-9 sm:py-8">
          <CrescentMark />

          <div
            className="font-serif-warm mt-3 text-[24px] font-semibold text-white tracking-tight"
            style={{ textShadow: "0 0 18px rgba(196, 181, 253, 0.75), 0 0 42px rgba(124, 58, 237, 0.45)" }}
          >
            {t("landing.v2.brand")}
          </div>

          <div className="mt-3 flex w-full max-w-[260px] items-center gap-2">
            <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.85))" }} />
            <Sparkle className="animate-star-twinkle h-3 w-3 [animation-duration:3.5s]" />
            <span className="h-px flex-1" style={{ background: "linear-gradient(270deg, transparent, rgba(167,139,250,0.85))" }} />
          </div>

          <h1 className="font-serif-warm animate-headline-glow mt-4 text-[28px] sm:text-[38px] font-semibold text-white leading-[1.05] tracking-[-0.015em] whitespace-pre-line">
            {t("landing.v2.title")}
          </h1>


          <p
            tabIndex={0}
            className="magic-glow-text mt-3 sm:mt-4 cursor-default text-[19px] sm:text-[21px] font-medium tracking-wide"
          >
            {t("landing.v2.subtitle")}
          </p>

          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="cosmic-cta mt-5 sm:mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full px-8 py-4 text-base font-semibold text-white"
          >
            <TeacupIcon />
            {t("landing.v2.cta.table")}
          </Link>

          {/* Constellation of people */}
          <img
            src={constellationAsset.url}
            alt="A constellation of people connected together"
            width={1024}
            height={768}
            loading="lazy"
            className="mt-4 w-full max-w-[230px] sm:mt-5 sm:max-w-[300px] animate-constellation-float select-none"
            style={{ filter: "drop-shadow(0 0 26px rgba(124,58,237,0.45))" }}
          />

          <div className="mt-5 sm:mt-6 grid w-full grid-cols-2 gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="cosmic-outline-btn inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium"
            >
              <UserPlus className="h-4 w-4" />
              {t("landing.v2.cta.signup")}
            </Link>
            <Link
              to="/auth"
              className="cosmic-outline-btn inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium"
            >
              <Lock className="h-4 w-4" />
              {t("landing.v2.cta.login")}
            </Link>
          </div>

          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs"
            style={{ color: "rgba(196, 181, 253, 0.55)" }}
          >
            <Link to="/partnership" className="hover:text-white/80 transition-colors">{t("landing.v2.footer.about")}</Link>
            <span>·</span>
            <Link to="/venue/auth" className="hover:text-white/80 transition-colors">{t("landing.v2.footer.venues")}</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-white/80 transition-colors">{t("landing.v2.footer.terms")}</Link>
          </div>

          <div className="mt-5 scale-50 opacity-50">
            <CrescentMark />
          </div>
          </div>
        </div>
      </section>


      <HowItWorksSection />
    </div>
  );
}
