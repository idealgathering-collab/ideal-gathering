import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Shield } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n";
import { setAdminPreview } from "@/lib/roles";

export function AdminHeader() {
  const t = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleSignOut() {
    setAdminPreview(false);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/auth", replace: true });
  }

  return (
    <header className="glass-card sticky top-0 z-40 w-full text-dark-secondary">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link to="/admin" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="" className="h-9 w-9 rounded-full object-contain" />
          <span className="font-display text-lg leading-none text-dark-heading">
            Ideal <span className="italic text-dark-primary">Gathering</span>
            <span className="ms-2 align-middle text-xs font-sans font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("adminAuth.for")}
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1.5">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="sm"
            className="hidden rounded-full sm:inline-flex"
            onClick={() => {
              setAdminPreview(true);
              navigate({ to: "/explore" });
            }}
          >
            {t("adminAuth.preview")}
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
          <Shield className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden />
        </nav>
      </div>
    </header>
  );
}
