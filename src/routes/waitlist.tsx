import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "Join the waitlist — Ideal Gathering" },
      {
        name: "description",
        content:
          "Reserve your spot on the Ideal Gathering guest waitlist. We'll invite you as tables open in your city.",
      },
    ],
  }),
  component: WaitlistPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  interests: z.string().trim().max(500).optional().or(z.literal("")),
});

const INTEREST_KEYS = [
  "wait.pick.tech",
  "wait.pick.philosophy",
  "wait.pick.psychology",
  "wait.pick.travel",
  "wait.pick.books",
  "wait.pick.design",
] as const;

function WaitlistPage() {
  const t = useT();
  const [form, setForm] = useState({ name: "", email: "", city: "", interests: "" });
  const [picks, setPicks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function togglePick(key: string) {
    setPicks((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : prev.length >= 3
        ? prev
        : [...prev, key],
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const v = schema.parse(form);
      setLoading(true);
      const pickedLabels = picks.map((k) => t(k)).join(", ");
      const combinedInterests = [pickedLabels, v.interests].filter(Boolean).join(" · ");
      const { error } = await supabase.from("waitlist").insert({
        name: v.name,
        email: v.email,
        city: v.city || null,
        interests: combinedInterests || null,
      });
      if (error) {
        if (error.code === "23505") {
          toast.success(t("wait.alreadyOn"));
          setDone(true);
          return;
        }
        throw error;
      }
      toast.success(t("wait.joined"));
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("wait.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <SiteHeader />
      <div className="absolute inset-x-0 top-16 bottom-0 bg-gradient-hero opacity-90" />
      <div className="relative mx-auto flex max-w-md flex-col justify-center px-4 py-12">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-primary-foreground">
          <img src={logoAsset.url} alt="Ideal Gathering" className="h-9 w-9 rounded-full object-contain" />
          <span className="font-display text-xl">
            Ideal <span className="italic">Gathering</span>
          </span>
        </Link>


        <div className="rounded-3xl border border-border bg-card p-8 shadow-plum">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sunshine/50 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> {t("wait.badge")}
          </div>
          <h1 className="font-display text-3xl">{t("wait.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("wait.subtitle")}
          </p>

          {done ? (
            <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-6 text-sm">
              <p className="font-display text-lg">{t("wait.done.title")}</p>
              <p className="mt-1 text-muted-foreground">
                {t("wait.done.body", { email: form.email })}
              </p>
              <Button asChild className="mt-4 rounded-full" variant="outline">
                <Link to="/">{t("common.backToGatherings")}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("wait.name")}</Label>
                <Input
                  id="name"
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t("wait.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">{t("wait.city")}</Label>
                <Input
                  id="city"
                  maxLength={80}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="interests">{t("wait.interests")}</Label>
                <Textarea
                  id="interests"
                  maxLength={500}
                  value={form.interests}
                  onChange={(e) => setForm({ ...form, interests: e.target.value })}
                  placeholder={t("wait.interestsPh")}
                />
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="text-sm font-medium">{t("wait.pick.title")}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t("wait.pick.hint")}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {INTEREST_KEYS.map((key) => {
                    const active = picks.includes(key);
                    const disabled = !active && picks.length >= 3;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => togglePick(key)}
                        disabled={disabled}
                        aria-pressed={active}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:border-primary/50"
                        } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {t(key)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button type="submit" disabled={loading} className="mt-2 h-11 rounded-full text-base">
                {loading ? "…" : t("wait.join")}
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            {t("wait.footer.q")}{" "}
            <Link to="/auth" search={{ mode: "signup" } as never} className="text-primary hover:underline">
              {t("wait.footer.link")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
