import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useT } from "@/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useSession } from "@/hooks/use-session";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";
import landingBgAsset from "@/assets/landing-fantasy-cafe.png.asset.json";




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
      <div className="landing-dark relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  const particles = Array.from({ length: 32 }, (_, i) => {
    const seed = i * 9301 + 49297;
    return {
      x: seed % 100,
      y: (seed * 3) % 100,
      size: 1 + ((i * 7) % 3),
      delay: (i % 8) * 0.6,
      duration: 6 + (i % 5),
      opacity: 0.3 + ((i % 5) * 0.12),
    };
  });

  const nodes = [
    { x: 15, y: 22 }, { x: 32, y: 12 }, { x: 55, y: 20 }, { x: 78, y: 14 },
    { x: 88, y: 40 }, { x: 72, y: 78 }, { x: 42, y: 85 }, { x: 12, y: 68 },
  ];
  const edges: Array<[number, number]> = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
    [1, 7], [2, 6], [0, 2], [4, 6],
  ];

  return (
    <div className="landing-dark relative z-0 flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-6 text-center">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Illustrated fantasy café background (slow ambient drift) */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-0 bg-cover bg-center animate-bg-drift"
        style={{
          backgroundImage: `url(${landingBgAsset.url})`,
          inset: "-4%",
          willChange: "transform",
        }}
      />
      {/* Dark readability overlay — stronger at top/bottom, lighter in center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[15]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(15,10,30,0.35) 0%, rgba(15,10,30,0.75) 60%, rgba(15,10,30,0.92) 100%)",
        }}
      />




      {/* Constellation network */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 z-10 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">

        <defs>
          <linearGradient id="edge-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(167,139,250,0.6)" />
            <stop offset="100%" stopColor="rgba(124,58,237,0.15)" />
          </linearGradient>
        </defs>
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
            stroke="url(#edge-grad)" strokeWidth={0.15} vectorEffect="non-scaling-stroke"
            style={{ animation: `edge-pulse 4s ease-in-out ${i * 0.35}s infinite` }}
          />
        ))}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={0.6} fill="#C4B5FD"
            style={{ animation: `node-pulse 3.5s ease-in-out ${i * 0.4}s infinite`, filter: "drop-shadow(0 0 2px rgba(167,139,250,0.9))" }}
          />
        ))}
      </svg>

      {/* Floating particles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">

        {particles.map((p, i) => (
          <span key={i} className="absolute rounded-full"
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: `${p.size}px`, height: `${p.size}px`,
              background: i % 3 === 0 ? "#A78BFA" : "#C4B5FD",
              opacity: p.opacity,
              boxShadow: "0 0 6px rgba(167,139,250,0.7)",
              animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>



      <div className="relative z-20 flex max-w-xl flex-col items-center">
        <div className="flex flex-col items-center gap-3">

          <img
            src={logoAsset.url}
            alt="Ideal Gathering"
            className="h-16 w-16 rounded-full object-contain"
          />
          <div
            className="font-serif-warm text-[26px] font-semibold text-white tracking-tight"
            style={{ textShadow: "0 0 24px rgba(196, 181, 253, 0.35)" }}
          >
            {t("landing.v2.brand")}
          </div>
        </div>

        <h1
          className="font-serif-warm mt-8 text-[42px] sm:text-[52px] font-semibold text-white leading-[1.06] tracking-[-0.01em] whitespace-pre-line"
          style={{
            textShadow:
              "0 0 40px rgba(124, 58, 237, 0.45), 0 0 90px rgba(212, 160, 74, 0.18)",
          }}
        >
          {t("landing.v2.title")}
        </h1>

        <p className="mt-5 text-[20px] sm:text-[22px] font-medium" style={{ color: "#C4B5FD" }}>
          {t("landing.v2.subtitle")}
        </p>

        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="mt-14 inline-flex items-center justify-center rounded-[12px] px-9 py-4 text-base font-semibold text-white transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            boxShadow: "0 0 20px rgba(124, 58, 237, 0.4)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 30px rgba(124, 58, 237, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 0 20px rgba(124, 58, 237, 0.4)";
          }}
        >
          {t("landing.v2.cta.join")}
        </Link>
      </div>

      <div
        className="relative z-20 mt-12 flex flex-wrap items-center justify-center gap-3 text-xs"
        style={{ color: "rgba(196, 181, 253, 0.5)" }}
      >
        <Link to="/auth" className="hover:text-white/80 transition-colors">{t("landing.v2.cta.login")}</Link>
        <span>·</span>
        <Link to="/partnership" className="hover:text-white/80 transition-colors">{t("landing.v2.footer.about")}</Link>
        <span>·</span>
        <Link to="/venue/auth" className="hover:text-white/80 transition-colors">{t("landing.v2.footer.venues")}</Link>
        <span>·</span>
        <Link to="/terms" className="hover:text-white/80 transition-colors">{t("landing.v2.footer.terms")}</Link>
      </div>


    </div>
  );
}
