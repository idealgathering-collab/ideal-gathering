import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, LogOut, Settings, Shield, Sparkles } from "lucide-react";
import { NotificationsBell } from "@/components/notifications-bell";
import { useEffect, useState } from "react";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";


import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n";
import { setAdminPreview } from "@/lib/roles";
import { getMostIncompleteSection, getCompletionLevel, getCompletionColor } from "@/lib/profile-completion";
import type { GuestProfile } from "@/lib/guest-profile";

export function SiteHeader() {
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const topLevelNavPaths = ["/", "/dashboard", "/explore", "/my-gatherings", "/chat", "/profile"];
  const showBack = !topLevelNavPaths.includes(pathname);

  const [isAdmin, setIsAdmin] = useState(false);
  const [completionPercent, setCompletionPercent] = useState<number | null>(null);
  const [incompleteSection, setIncompleteSection] = useState<ReturnType<typeof getMostIncompleteSection> | null>(null);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setCompletionPercent(null);
      setIncompleteSection(null);
      return;
    }
    
    // Load admin status
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
    
    // Load profile completion
    async function loadCompletion() {
      const { loadGuestProfile } = await import("@/lib/guest-profile.functions");
      const profile = await loadGuestProfile(user.id);
      if (profile) {
        const { getProfileCompletion } = await import("@/lib/profile-completion");
        const completion = getProfileCompletion(profile, true);
        setCompletionPercent(completion.overallPercent);
        
        const { getMostIncompleteSection } = await import("@/lib/profile-completion");
        const incomplete = getMostIncompleteSection(profile, true);
        setIncompleteSection(incomplete);
      }
    }
    
    loadCompletion();
  }, [user]);


  async function handleSignOut() {
    setAdminPreview(false);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="glass-card sticky top-0 z-40 w-full text-dark-secondary">
      {isAdmin && (
        <div className="border-b border-border/60 bg-muted/40 px-4 py-1.5 text-center text-xs text-muted-foreground">
          {t("adminAuth.previewBanner")}{" "}
          <Link
            to="/admin"
            className="font-medium text-primary hover:underline"
            onClick={() => setAdminPreview(false)}
          >
            {t("adminAuth.backToOwner")}
          </Link>
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-1.5">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("common.back")}
              className="rounded-full"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) window.history.back();
                else navigate({ to: "/" });
              }}
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
          )}

          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <img
              src={logoAsset.url}
              alt="Ideal Gathering"
              className="h-9 w-9 rounded-full object-contain animate-logo-spin"
            />
            <span className="font-display text-xl leading-none hidden xs:inline sm:inline text-dark-heading">
              Ideal <span className="italic text-dark-primary">Gathering</span>
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-1.5">
          <LanguageSwitcher />
          {user ? (
            <>
              <NavLink to="/dashboard" pathname={pathname}>{t("nav.dashboard")}</NavLink>
              <NavLink to="/explore" pathname={pathname}>{t("nav.explore")}</NavLink>
              <NavLink to="/my-gatherings" pathname={pathname}>{t("nav.myGatherings")}</NavLink>
              <NavLink to="/chat" pathname={pathname}>{t("nav.chat")}</NavLink>
              <NavLink to="/profile" pathname={pathname}>{t("nav.profile")}</NavLink>
              
              {incompleteSection && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden rounded-full sm:inline-flex text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                >
                  <Link to={incompleteSection.actionUrl ?? "/profile"}>
                    <Sparkles className="me-1 h-3.5 w-3.5" />
                    {t("nav.completeProfile")}
                  </Link>
                </Button>
              )}

              {isAdmin && (
                <Button asChild variant="ghost" size="sm" className="hidden rounded-full sm:inline-flex">
                  <Link to="/admin" onClick={() => setAdminPreview(false)}>
                    <Shield className="me-1 h-3.5 w-3.5" />
                    {t("nav.admin")}
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label={t("nav.settings")}
                className="rounded-full hidden sm:inline-flex text-dark-secondary hover:text-dark-heading hover:bg-white/5"
              >
                <Link to="/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              <NotificationsBell />
              <Button asChild size="sm" className="glow-button rounded-full hidden sm:inline-flex">
                <Link to="/create-gathering">{t("nav.host")}</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                aria-label={t("nav.signOut")}
                className="rounded-full hidden sm:inline-flex text-dark-secondary hover:text-dark-heading hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" />
              </Button>

            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/our-story">{t("nav.ourStory")}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/partnership">{t("nav.partnership")}</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/auth" search={{ mode: "signup" }}>{t("nav.join")}</Link>
              </Button>

            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ to, pathname, children }: { to: string; pathname: string; children: React.ReactNode }) {
  const active = pathname === to || pathname.startsWith(to + "/");
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={
        "hidden sm:inline-flex rounded-full transition-shadow " +
        (active
          ? "text-dark-heading bg-white/10 shadow-[0_0_20px_-4px_color-mix(in_srgb,var(--dark-primary)_60%,transparent)]"
          : "text-dark-secondary hover:text-dark-heading hover:bg-white/5")
      }
    >
      <Link to={to as never}>{children}</Link>
    </Button>
  );
}
