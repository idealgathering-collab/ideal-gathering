import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Coffee, LogOut, User as UserIcon } from "lucide-react";

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

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-hero shadow-plum">
            <Coffee className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-display text-xl leading-none">
            Ideal <span className="italic text-primary">Gathering</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <LanguageSwitcher />
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
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
                to="/dashboard"
                className="sm:hidden grid h-9 w-9 place-items-center rounded-full bg-muted"
                aria-label={t("nav.account")}
              >
                <UserIcon className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">{t("nav.signIn")}</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/waitlist">{t("nav.join")}</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
