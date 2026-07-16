import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { VerifyEmailBanner } from "@/components/verify-email-banner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n";
import { LocationAutocomplete, type LocationValue } from "@/components/location-autocomplete";

export const Route = createFileRoute("/_authenticated/create-gathering")({
  component: CreateGathering,
});

const schema = z.object({
  subject: z.string().trim().min(3, "Subject too short").max(120),
  description: z.string().trim().max(800).optional().or(z.literal("")),
  venue_name: z.string().trim().min(2, "Venue name required").max(200),
  neighborhood: z.string().trim().min(1).max(120),
  starts_at: z.string().min(1, "Pick a date & time"),
  seats: z.coerce.number().int().min(2).max(30),
});

function CreateGathering() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const t = useT();
  const [form, setForm] = useState({
    subject: "",
    description: "",
    venue_name: "",
    neighborhood: "",
    starts_at: "",
    seats: 4,
  });
  const [location, setLocation] = useState<LocationValue | null>(null);

  const emailVerified = Boolean(user?.email_confirmed_at);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!emailVerified) {
      toast.error(t("create.verifyFirst"));
      return;
    }
    try {
      const v = schema.parse(form);
      const iso = new Date(v.starts_at).toISOString();
      if (new Date(iso) < new Date()) {
        toast.error(t("create.futureTime"));
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("gatherings")
        .insert({
          business_id: null,
          table_id: null,
          host_id: user.id,
          subject: v.subject,
          description: v.description || null,
          venue_name: v.venue_name,
          neighborhood: v.neighborhood,
          address: location?.address ?? null,
          city: location?.city ?? null,
          lat: location?.lat ?? null,
          lng: location?.lng ?? null,
          starts_at: iso,
          seats: v.seats,
          status: "proposed",
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success(t("create.proposed"));
      navigate({ to: "/gatherings/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("create.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-hero">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("create.eyebrow")}</p>
            <h1 className="font-display text-3xl">{t("create.title")}</h1>
          </div>
        </div>

        {!emailVerified && (
          <div className="mb-6">
            <VerifyEmailBanner email={user?.email} />
          </div>
        )}

        <form onSubmit={submit} className="grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="grid gap-2">
            <Label htmlFor="subject">{t("create.subject")}</Label>
            <Input
              id="subject"
              required
              maxLength={120}
              value={form.subject}
              placeholder={t("create.subjectPh")}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">{t("create.description")}</Label>
            <Textarea
              id="description"
              maxLength={800}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t("create.descriptionPh")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="venue_name">{t("create.venueName")}</Label>
            <Input
              id="venue_name"
              required
              maxLength={200}
              value={form.venue_name}
              placeholder={t("create.venueNamePh")}
              onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">{t("create.location")}</Label>
            <LocationAutocomplete
              id="location"
              required
              value={form.neighborhood}
              placeholder={t("create.locationPh")}
              onChange={(text) => setForm({ ...form, neighborhood: text })}
              onSelect={(loc) => {
                setLocation(loc);
                setForm({ ...form, neighborhood: loc.city || loc.display_name });
              }}
            />
            {location && (
              <p className="text-xs text-muted-foreground">{location.address}</p>
            )}
          </div>


          <p className="rounded-2xl bg-sunshine/40 px-4 py-3 text-xs text-foreground/80">
            {t("create.needsApproval")}
          </p>

          <Button type="submit" size="lg" disabled={loading || !emailVerified} className="mt-2 h-12 rounded-full">
            {loading ? t("create.sending") : !emailVerified ? t("create.verifyToContinue") : t("create.propose")}
          </Button>
        </form>
      </main>
    </div>
  );
}
