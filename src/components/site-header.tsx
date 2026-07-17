import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, LogOut, Shield, User as UserIcon } from "lucide-react";
import { NotificationsBell } from "@/components/notifications-bell";
import { useEffect, useState } from "react";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";


import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n";

export function SiteHeader() {
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showBack = pathname !== "/";
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);


  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
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
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logoAsset.url}
            alt="Ideal Gathering"
            className="h-9 w-9 rounded-full object-contain"
          />
          <span className="font-display text-xl leading-none">
            Ideal <span className="italic text-primary">Gathering</span>
          </span>
        </Link>

        </div>



        <nav className="flex items-center gap-1.5">
          <LanguageSwitcher />
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/profile">{t("nav.profile")}</Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/admin">
                    <Shield className="mr-1 h-3.5 w-3.5" />
                    {t("nav.admin")}
                  </Link>
                </Button>
              )}
              <NotificationsBell />
              <Button asChild size="sm" className="rounded-full">
                <Link to="/create-gathering">{t("nav.host")}</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                aria-label={t("nav.signOut")}
                className="rounded-full"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Link
                to="/profile"
                className="sm:hidden grid h-9 w-9 place-items-center rounded-full bg-muted"
                aria-label={t("nav.account")}
              >
                <UserIcon className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
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
