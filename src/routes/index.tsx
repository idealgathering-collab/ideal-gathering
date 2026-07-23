import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/i18n";
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

function Home() {
  const t = useT();
  void t;

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-between px-6 py-8 text-center">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)" }}
      />

      <div className="h-4" />

      <div className="flex max-w-xl flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <img
            src={logoAsset.url}
            alt="Ideal Gathering"
            className="h-16 w-16 rounded-full object-contain"
          />
          <div className="text-[24px] font-bold text-white tracking-tight">
            Ideal Gathering
          </div>
        </div>


        <h1
          className="text-[40px] sm:text-[48px] font-bold text-white leading-[1.05]"
          style={{ textShadow: "0 0 40px rgba(124, 58, 237, 0.35)" }}
        >
          No one will be<br />alone anymore.
        </h1>

        <p className="text-[20px] sm:text-[22px] font-medium" style={{ color: "#C4B5FD" }}>
          Just Gather
        </p>

        <Link
          to="/waitlist"
          className="mt-2 inline-flex items-center justify-center rounded-[12px] px-8 py-4 text-base font-semibold text-white transition-all duration-300"
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
          Join the Table
        </Link>

        <div className="text-sm" style={{ color: "#A78BFA" }}>
          2,000+ connections made ✦
        </div>

        <div className="mt-2 flex items-center gap-3">
          <Link
            to="/waitlist"
            className="inline-flex items-center justify-center rounded-[12px] border px-6 py-2.5 text-sm font-medium transition-all"
            style={{
              borderColor: "rgba(139, 92, 246, 0.4)",
              color: "#A78BFA",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.9)";
              e.currentTarget.style.boxShadow = "0 0 18px rgba(139, 92, 246, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.4)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Sign Up
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-[12px] border px-6 py-2.5 text-sm font-medium transition-all"
            style={{
              borderColor: "rgba(139, 92, 246, 0.4)",
              color: "#A78BFA",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.9)";
              e.currentTarget.style.boxShadow = "0 0 18px rgba(139, 92, 246, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.4)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Log In
          </Link>
        </div>
      </div>

      <div
        className="flex items-center gap-3 text-xs"
        style={{ color: "rgba(196, 181, 253, 0.5)" }}
      >
        <Link to="/partnership" className="hover:text-white/80 transition-colors">About</Link>
        <span>·</span>
        <Link to="/venue/auth" className="hover:text-white/80 transition-colors">For Venues</Link>
        <span>·</span>
        <Link to="/terms" className="hover:text-white/80 transition-colors">Terms</Link>
      </div>
    </div>
  );
}
