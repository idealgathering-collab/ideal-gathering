import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Compass, CalendarHeart, MessageCircle, User as UserIcon } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useT } from "@/i18n";
import type { ComponentType } from "react";

type Tab = { to: string; label: string; icon: ComponentType<{ className?: string }>; match: (p: string) => boolean };

export function MobileTabBar() {
  const { user } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();

  if (!user) return null;
  // Hide on landing / auth pages
  if (pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/venue/auth")) return null;

  const tabs: Tab[] = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard, match: (p) => p === "/dashboard" },
    { to: "/explore", label: t("nav.explore"), icon: Compass, match: (p) => p.startsWith("/explore") },
    { to: "/my-gatherings", label: t("bottomNav.myGatherings"), icon: CalendarHeart, match: (p) => p.startsWith("/my-gatherings") || p.startsWith("/gatherings") },
    { to: "/chat", label: t("bottomNav.chat"), icon: MessageCircle, match: (p) => p.startsWith("/chat") },
    { to: "/profile", label: t("nav.profile"), icon: UserIcon, match: (p) => p.startsWith("/profile") },
  ];

  return (
    <nav
      className="glass-card fixed inset-x-0 bottom-0 z-40 sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);
          return (
            <li key={i} className="flex">
              <Link
                to={tab.to as never}
                className={
                  "flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-all " +
                  (active
                    ? "text-dark-heading"
                    : "text-dark-secondary hover:text-dark-heading")
                }
              >
                <span
                  className={
                    "grid h-9 w-9 place-items-center rounded-full transition-shadow " +
                    (active
                      ? "bg-white/10 shadow-[0_0_20px_-4px_color-mix(in_srgb,var(--dark-primary)_70%,transparent)]"
                      : "")
                  }
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="truncate leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
