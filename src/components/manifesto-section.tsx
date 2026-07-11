import { Sparkles } from "lucide-react";
import { useT } from "@/i18n";

export function ManifestoSection() {
  const t = useT();
  return (
    <section id="vibe" className="relative overflow-hidden bg-plum text-primary-foreground">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, oklch(0.72 0.18 55 / 0.55) 0%, transparent 45%), radial-gradient(circle at 85% 80%, oklch(0.85 0.15 85 / 0.35) 0%, transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-wide backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-sunshine" /> {t("manifesto.badge")}
        </div>
        <h2 className="mt-6 font-display text-4xl leading-tight sm:text-6xl">
          {t("manifesto.title")}
        </h2>
        <p className="mx-auto mt-8 max-w-2xl font-display text-2xl leading-relaxed text-primary-foreground/90 sm:text-3xl">
          {t("manifesto.body")}
        </p>
        <div className="mt-10 text-sm uppercase tracking-widest text-sunshine">
          {t("manifesto.signature")}
        </div>
      </div>
    </section>
  );
}
