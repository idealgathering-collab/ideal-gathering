import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import {
  CONVERSATION_STYLE_OPTIONS,
  EMPTY_PREFERENCES,
  GATHERING_TYPE_OPTIONS,
  GROUP_SIZE_OPTIONS,
  INTENTION_OPTIONS,
  MAX_INTENTIONS,
  SOCIAL_ENERGY_OPTIONS,
  SPONTANEITY_OPTIONS,
  STRANGER_COMFORT_OPTIONS,
  type GatheringPreferences,
} from "@/lib/gathering-preferences";

type QuestionKey =
  | "intentions"
  | "types"
  | "size"
  | "energy"
  | "conversation"
  | "spontaneity"
  | "strangers";

const ORDER: QuestionKey[] = [
  "intentions",
  "types",
  "size",
  "energy",
  "conversation",
  "spontaneity",
  "strangers",
];

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition ${
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {selected && <Check className="h-3.5 w-3.5 text-primary" />}
      {label}
    </button>
  );
}

function Row({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-start text-sm font-medium transition ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * The warm, lightweight "Gathering preferences" screens shown before the
 * existing personality quiz. One question per screen, nothing required.
 */
export function GatheringPreferencesFlow({
  initial,
  onDone,
  onSkip,
}: {
  initial?: GatheringPreferences | null;
  onDone: (prefs: GatheringPreferences) => void;
  onSkip: () => void;
}) {
  const t = useT();
  const [prefs, setPrefs] = useState<GatheringPreferences>(initial ?? EMPTY_PREFERENCES);
  const [index, setIndex] = useState(0);
  const key = ORDER[index];
  const last = index === ORDER.length - 1;

  function set<K extends keyof GatheringPreferences>(k: K, v: GatheringPreferences[K]) {
    setPrefs((p) => ({ ...p, [k]: v }));
  }

  function toggleIntention(value: string) {
    const has = prefs.intentions.includes(value);
    if (!has && prefs.intentions.length >= MAX_INTENTIONS) return;
    set("intentions", has ? prefs.intentions.filter((v) => v !== value) : [...prefs.intentions, value]);
  }

  function toggleType(value: string) {
    const typed = value as GatheringPreferences["gathering_types"][number];
    const has = prefs.gathering_types.includes(typed);
    set(
      "gathering_types",
      has ? prefs.gathering_types.filter((v) => v !== typed) : [...prefs.gathering_types, typed],
    );
  }

  function next() {
    if (last) onDone(prefs);
    else setIndex(index + 1);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("onboarding.prefs.progress", { n: index + 1, total: ORDER.length })}
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("onboarding.prefs.skipSection")}
        </button>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 motion-reduce:transition-none"
          style={{ width: `${((index + 1) / ORDER.length) * 100}%` }}
        />
      </div>

      <h2 className="font-display mt-6 text-2xl sm:text-3xl">{t(`onboarding.prefs.${key}.q`)}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t(`onboarding.prefs.${key}.hint`)}</p>

      <div className="mt-6">
        {key === "intentions" && (
          <div className="flex flex-wrap gap-2">
            {INTENTION_OPTIONS.map((o) => (
              <Chip
                key={o}
                label={t(`onboarding.prefs.intentions.${o}`)}
                selected={prefs.intentions.includes(o)}
                onClick={() => toggleIntention(o)}
              />
            ))}
          </div>
        )}

        {key === "types" && (
          <div className="flex flex-wrap gap-2">
            {GATHERING_TYPE_OPTIONS.map((o) => (
              <Chip
                key={o}
                label={t(`onboarding.prefs.types.${o}`)}
                selected={prefs.gathering_types.includes(o)}
                onClick={() => toggleType(o)}
              />
            ))}
          </div>
        )}

        {key === "size" && (
          <div className="flex flex-col gap-3">
            {GROUP_SIZE_OPTIONS.map((o) => (
              <Row
                key={o.k}
                label={t(`onboarding.prefs.size.${o.k}`)}
                selected={prefs.preferred_group_size === o.value}
                onClick={() => set("preferred_group_size", o.value)}
              />
            ))}
          </div>
        )}

        {key === "energy" && (
          <div className="flex flex-col gap-3">
            {SOCIAL_ENERGY_OPTIONS.map((o) => (
              <Row
                key={o}
                label={t(`onboarding.prefs.energy.${o}`)}
                selected={prefs.social_energy === o}
                onClick={() => set("social_energy", o)}
              />
            ))}
          </div>
        )}

        {key === "conversation" && (
          <div className="flex flex-col gap-3">
            {CONVERSATION_STYLE_OPTIONS.map((o) => (
              <Row
                key={o}
                label={t(`onboarding.prefs.conversation.${o}`)}
                selected={prefs.conversation_style === o}
                onClick={() => set("conversation_style", o)}
              />
            ))}
          </div>
        )}

        {key === "spontaneity" && (
          <div className="flex flex-col gap-3">
            {SPONTANEITY_OPTIONS.map((o) => (
              <Row
                key={o}
                label={t(`onboarding.prefs.spontaneity.${o}`)}
                selected={prefs.spontaneity === o}
                onClick={() => set("spontaneity", o)}
              />
            ))}
          </div>
        )}

        {key === "strangers" && (
          <div className="flex flex-col gap-3">
            {STRANGER_COMFORT_OPTIONS.map((o) => (
              <Row
                key={o}
                label={t(`onboarding.prefs.strangers.${o}`)}
                selected={prefs.stranger_comfort === o}
                onClick={() => set("stranger_comfort", o)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex(Math.max(0, index - 1))}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("landing.v3.matching.quiz.back")}
        </button>
        <Button className="rounded-full" onClick={next}>
          {last ? t("onboarding.continue") : t("onboarding.prefs.next")}
          <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
