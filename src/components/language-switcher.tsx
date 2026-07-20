import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGS, useI18n } from "@/i18n";
import { LangFlag } from "@/components/flag-icons";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full ring-2 ring-primary/60 shadow-[0_0_12px_hsl(280_60%_50%/0.45)] hover:animate-flag-pulse overflow-hidden"
          aria-label={t("nav.language")}
        >
          <LangFlag code={current.code} className="h-5 w-5 rounded-full object-cover" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((l) => {
          const active = l.code === lang;
          return (
            <DropdownMenuItem
              key={l.code}
              onSelect={() => setLang(l.code)}
              className={active ? "font-semibold text-primary" : ""}
            >
              <span
                className={
                  "me-2 inline-grid h-7 w-7 place-items-center rounded-full overflow-hidden transition hover:animate-flag-pulse " +
                  (active
                    ? "ring-2 ring-primary/70 shadow-[0_0_10px_hsl(280_60%_50%/0.55)]"
                    : "ring-1 ring-border")
                }
              >
                <LangFlag code={l.code} className="h-full w-full object-cover" />
              </span>
              {l.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
