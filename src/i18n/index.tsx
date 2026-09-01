import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, LANGS, type Lang } from "./translations";

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
  // Always start with "en" on SSR + first client render to avoid hydration mismatch.
  const [lang, setLangState] = useState<Lang>("en");

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
      const nav = window.navigator.language?.toLowerCase() ?? "";
      if (nav.startsWith("ru")) setLangState("ru");
      else if (nav.startsWith("fa") || nav.startsWith("pe")) setLangState("fa");
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
      if (l === "en") url.searchParams.delete("lang");
      else url.searchParams.set("lang", l);
      window.history.replaceState(null, "", url.toString());
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = translations[lang];
      let s = dict[key] ?? translations.en[key] ?? key;
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
    let s = translations.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    return s;
  };
}


export { LANGS };
export type { Lang };
