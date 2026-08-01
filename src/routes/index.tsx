import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { UserPlus, Lock } from "lucide-react";
import { useT } from "@/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useSession } from "@/hooks/use-session";
import nebulaAsset from "@/assets/landing-nebula-skyline.jpg.asset.json";
import constellationAsset from "@/assets/constellation-people.png.asset.json";

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
    <svg
      aria-hidden
      viewBox="0 0 64 64"
      className="h-11 w-11"
      fill="none"
      stroke="rgba(196,181,253,0.85)"
      strokeWidth={1.2}
      style={{ filter: "drop-shadow(0 0 8px rgba(167,139,250,0.6))" }}
    >
      <ellipse cx="32" cy="32" rx="26" ry="14" opacity="0.45" />
      <path d="M38 20a14 14 0 1 0 0 24 17 17 0 0 1 0-24Z" opacity="0.95" />
      <circle cx="32" cy="8" r="1.6" fill="rgba(233,226,255,0.95)" stroke="none" />
      <circle cx="7" cy="34" r="1.2" fill="rgba(233,226,255,0.8)" stroke="none" />
      <circle cx="57" cy="30" r="1.2" fill="rgba(233,226,255,0.8)" stroke="none" />
      <path d="M32 24l1.6 4.4L38 30l-4.4 1.6L32 36l-1.6-4.4L26 30l4.4-1.6L32 24Z" fill="rgba(233,226,255,0.9)" stroke="none" />
    </svg>
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

function Home() {
  const t = useT();
  const { session, loading } = useSession();
  const navigate = useNavigate();

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

  const stars = Array.from({ length: 44 }, (_, i) => {
    const seed = i * 9301 + 49297;
    return {
      x: seed % 100,
      y: (seed * 7) % 100,
      size: 1 + ((i * 5) % 3),
      delay: (i % 9) * 0.5,
      duration: 3 + (i % 5),
    };
  });

  return (
    <div className="landing-dark cosmic-scene relative z-0 flex min-h-[100dvh] items-center justify-center overflow-hidden p-3 sm:p-6">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Nebula + Istanbul skyline backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-0 bg-cover bg-center animate-bg-drift"
        style={{
          backgroundImage: `url(${nebulaAsset.url})`,
          inset: "-4%",
          willChange: "transform",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(10,6,22,0.25) 0%, rgba(10,6,22,0.7) 65%, rgba(10,6,22,0.92) 100%)",
        }}
      />

      {/* Twinkling starfield */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[8] overflow-hidden">
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
              boxShadow: "0 0 6px rgba(196,181,253,0.8)",
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Glass panel */}
      <div className="cosmic-panel relative z-20 flex w-full max-w-[440px] flex-col items-center overflow-hidden px-6 py-8 text-center sm:px-9 sm:py-10">
        <CrescentMark />

        <div
          className="font-serif-warm mt-3 text-[24px] font-semibold text-white tracking-tight"
          style={{ textShadow: "0 0 24px rgba(196, 181, 253, 0.4)" }}
        >
          {t("landing.v2.brand")}
        </div>

        <div className="mt-3 flex w-full max-w-[260px] items-center gap-2">
          <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.55))" }} />
          <Sparkle className="h-3 w-3" />
          <span className="h-px flex-1" style={{ background: "linear-gradient(270deg, transparent, rgba(167,139,250,0.55))" }} />
        </div>

        <h1
          className="font-serif-warm mt-6 text-[34px] sm:text-[40px] font-semibold text-white leading-[1.05] tracking-[-0.015em] whitespace-pre-line"
          style={{
            textShadow:
              "0 0 40px rgba(124, 58, 237, 0.5), 0 0 90px rgba(212, 160, 74, 0.16)",
          }}
        >
          {t("landing.v2.title")}
        </h1>

        <p
          tabIndex={0}
          className="magic-glow-text mt-4 cursor-default text-[19px] sm:text-[21px] font-medium tracking-wide"
        >
          {t("landing.v2.subtitle")}
        </p>

        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="cosmic-cta mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full px-8 py-4 text-base font-semibold text-white"
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
          className="mt-7 w-full max-w-[330px] animate-constellation-float select-none"
          style={{ filter: "drop-shadow(0 0 26px rgba(124,58,237,0.45))" }}
        />

        <div className="mt-7 grid w-full grid-cols-2 gap-3">
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

        <CrescentMark />
      </div>
    </div>
  );
}
