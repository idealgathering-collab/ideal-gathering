import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Menu, X } from "lucide-react";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useSession } from "@/hooks/use-session";
import { useT } from "@/i18n";

const DEFAULT_ANCHORS = [
  { href: "#how", key: "landing.v4.nav.how" },
  { href: "#categories", key: "landing.v4.nav.categories" },
  { href: "#why", key: "landing.v4.nav.why" },
];


const PILL =
  "rounded-full px-3 py-2 text-sm text-[rgba(221,214,254,0.78)] transition-colors hover:bg-white/5 hover:text-white";
const PILL_MOBILE =
  "rounded-xl px-3 py-2.5 text-sm text-[rgba(221,214,254,0.85)] hover:bg-white/5 hover:text-white";

export function PublicHeader({
  anchors = DEFAULT_ANCHORS,
  fillOnScroll = true,
}: {
  anchors?: { href: string; key: string }[];
  fillOnScroll?: boolean;
}) {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showBack = pathname !== "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!fillOnScroll) return;
    const onScroll = () =>
      setScrolled((window.scrollY || document.documentElement.scrollTop || 0) > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [fillOnScroll]);

  const filled = fillOnScroll && scrolled;

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300 " +
        (filled
          ? "border-b border-white/10 bg-[rgba(12,7,26,0.96)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent")
      }
    >

      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-1.5">
          {showBack && (
            <button
              type="button"
              aria-label={t("common.back")}
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) window.history.back();
                else navigate({ to: "/" });
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[rgba(221,214,254,0.78)] transition-colors hover:bg-white/5 hover:text-white md:absolute md:-left-10"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={logoAsset.url}
              alt="Ideal Gathering"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-contain"
            />
            <span className="font-serif-warm text-lg font-semibold tracking-tight text-white">
              Ideal Gathering
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {anchors.map((a) => (
            <a key={a.href} href={a.href} className={PILL}>
              {t(a.key)}
            </a>
          ))}
          <Link to="/our-story" className={PILL}>
            {t("nav.ourStory")}
          </Link>
          <Link to="/partnership" className={PILL}>
            {t("nav.partnership")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <Link
              to="/dashboard"
              className="cosmic-cta hidden rounded-full px-4 py-2 text-sm font-semibold text-white sm:inline-flex"
            >
              {t("nav.dashboard")}
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="hidden rounded-full px-3 py-2 text-sm text-[rgba(221,214,254,0.78)] transition-colors hover:text-white sm:inline-flex"
              >
                {t("landing.v3.nav.login")}
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="cosmic-cta hidden rounded-full px-4 py-2 text-sm font-semibold text-white sm:inline-flex"
              >
                {t("landing.v3.nav.cta")}
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label={t("nav.menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[rgba(12,7,26,0.95)] px-4 pb-5 pt-3 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {anchors.map((a) => (
              <a key={a.href} href={a.href} onClick={() => setOpen(false)} className={PILL_MOBILE}>
                {t(a.key)}
              </a>
            ))}
            <Link to="/our-story" onClick={() => setOpen(false)} className={PILL_MOBILE}>
              {t("nav.ourStory")}
            </Link>
            <Link to="/partnership" onClick={() => setOpen(false)} className={PILL_MOBILE}>
              {t("nav.partnership")}
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="cosmic-cta mt-2 inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-white"
              >
                {t("nav.dashboard")}
              </Link>
            ) : (
              <>
                <Link to="/auth" onClick={() => setOpen(false)} className={PILL_MOBILE}>
                  {t("landing.v3.nav.login")}
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  onClick={() => setOpen(false)}
                  className="cosmic-cta mt-2 inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-white"
                >
                  {t("landing.v3.nav.cta")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
