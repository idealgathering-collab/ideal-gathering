import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Menu, X } from "lucide-react";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useSession } from "@/hooks/use-session";
import { useT } from "@/i18n";

const DEFAULT_ANCHORS = [
  { href: "#how", key: "landing.v3.nav.how" },
  { href: "#venues", key: "landing.v3.nav.venues" },
  { href: "#vision", key: "landing.v3.nav.vision" },
];

export function PublicHeader({
  anchors = DEFAULT_ANCHORS,
  fillOnScroll = true,
  light = false,
}: {
  anchors?: { href: string; key: string }[];
  fillOnScroll?: boolean;
  light?: boolean;
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

  const textColor = light ? "text-[#4A4468]" : "text-[rgba(221,214,254,0.78)]";
  const textHover = light
    ? "hover:bg-[rgba(124,58,237,0.08)] hover:text-[#1E1038]"
    : "hover:bg-white/5 hover:text-white";
  const filledBg = light
    ? "border-b border-[rgba(124,58,237,0.12)] bg-[rgba(250,248,245,0.96)] backdrop-blur-xl"
    : "border-b border-white/10 bg-[rgba(12,7,26,0.96)] backdrop-blur-xl";
  const mobileBg = light
    ? "border-t border-[rgba(124,58,237,0.12)] bg-[rgba(250,248,245,0.98)] backdrop-blur-xl"
    : "border-t border-white/10 bg-[rgba(12,7,26,0.95)] backdrop-blur-xl";
  const menuBtnBorder = light ? "border-[rgba(124,58,237,0.25)]" : "border-white/15";

  const Pill = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => (
    <a
      href={href}
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-sm ${textColor} transition-colors ${textHover}`}
    >
      {children}
    </a>
  );

  const PillLink = ({
    to,
    children,
    onClick,
  }: {
    to: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-sm ${textColor} transition-colors ${textHover}`}
    >
      {children}
    </Link>
  );

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300 " +
        (filled ? filledBg : "border-b border-transparent bg-transparent")
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
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${textColor} transition-colors hover:bg-white/5 hover:text-white md:absolute md:-left-10`}
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
            <span
              className={
                "font-serif-warm text-lg font-semibold tracking-tight " +
                (light && filled ? "text-[#1E1038]" : "text-white")
              }
            >
              Ideal Gathering
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {anchors.map((a) => (
            <Pill key={a.href} href={a.href}>
              {t(a.key)}
            </Pill>
          ))}
          <PillLink to="/our-story">{t("nav.ourStory")}</PillLink>
          <PillLink to="/partnership">{t("nav.partnership")}</PillLink>
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
                className={`hidden rounded-full px-3 py-2 text-sm ${textColor} transition-colors hover:text-white sm:inline-flex`}
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
            className={
              "inline-flex h-9 w-9 items-center justify-center rounded-full border md:hidden " +
              menuBtnBorder +
              " " +
              (light && filled ? "text-[#1E1038]" : "text-white")
            }
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className={`px-4 pb-5 pt-3 md:hidden ${mobileBg}`}>
          <div className="flex flex-col gap-1">
            {anchors.map((a) => (
              <Pill key={a.href} href={a.href} onClick={() => setOpen(false)}>
                {t(a.key)}
              </Pill>
            ))}
            <PillLink to="/our-story" onClick={() => setOpen(false)}>
              {t("nav.ourStory")}
            </PillLink>
            <PillLink to="/partnership" onClick={() => setOpen(false)}>
              {t("nav.partnership")}
            </PillLink>
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
                <PillLink to="/auth" onClick={() => setOpen(false)}>
                  {t("landing.v3.nav.login")}
                </PillLink>
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
