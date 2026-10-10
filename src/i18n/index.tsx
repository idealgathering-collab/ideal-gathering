import { brand, brandText } from "@/config/brand";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, LANGS, type Lang } from "./translations";
import { registrationCopy } from "./registration";
import { privateGatheringCopy } from "./private-gatherings";
import { guestInvitationCopy } from "./guest-invitations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "ideal-gathering.lang";

function isLang(v: unknown): v is Lang {
  return v === "en" || v === "ru" || v === "fa";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Farsi on SSR and the first client render; explicit saved/URL choices still win.
  const [lang, setLangState] = useState<Lang>("fa");

  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("lang");
      if (isLang(fromUrl)) {
        setLangState(fromUrl);
        window.localStorage.setItem(STORAGE_KEY, fromUrl);
        return;
      }
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLang(stored)) {
        setLangState(stored);
        return;
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
      // Keep the URL in sync so each language has a distinct, indexable URL.
      const url = new URL(window.location.href);
      url.searchParams.set("lang", l);
      window.history.replaceState(null, "", url.toString());
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = translations[lang];
      let s = brandText[lang]?.[key] ?? guestInvitationCopy[lang]?.[key] ?? privateGatheringCopy[lang]?.[key] ?? registrationCopy[lang]?.[key] ?? dict[key] ?? guestInvitationCopy.en[key] ?? privateGatheringCopy.en[key] ?? registrationCopy.en[key] ?? translations.en[key] ?? key;
      s = s.replaceAll("{brandName}", brand.name);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return s;
    },
    [lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx.t;
  // Fallback for trees that render outside the provider (e.g. root error boundary).
  return (key: string, vars?: Record<string, string | number>) => {
    let s = (brandText.en?.[key] ?? translations.en[key] ?? key).replaceAll(
      "{brandName}",
      brand.name,
    );
    if (vars)
      for (const [k, v] of Object.entries(vars))
        s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    return s;
  };
}

export { LANGS };
export type { Lang };
