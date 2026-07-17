import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/i18n";

export const Route = createFileRoute("/_authenticated/create-gathering")({
  component: CreateGathering,
});

const schema = z.object({
  business_id: z.string().uuid("Pick a venue"),
  table_id: z.string().uuid("Pick a table"),
  subject: z.string().trim().min(3).max(120),
  description: z.string().trim().max(800).optional().or(z.literal("")),
  starts_at: z.string().min(1, "Pick a date & time"),
  seats: z.coerce.number().int().min(2).max(30),
});

function CreateGathering() {
  const { user } = useSession();
  const navigate = useNavigate();
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_id: "",
    table_id: "",
    subject: "",
    description: "",
    starts_at: "",
    seats: 4,
  });

  const emailVerified = Boolean(user?.email_confirmed_at);

  const { data: venues } = useQuery({
    queryKey: ["approved-venues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,city,venue_tables(id,label,capacity)")
        .eq("status", "approved")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedBiz = venues?.find((v) => v.id === form.business_id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!emailVerified) return toast.error(t("create.verifyFirst"));
    try {
      const v = schema.parse(form);
      const iso = new Date(v.starts_at).toISOString();
      if (new Date(iso) < new Date()) return toast.error(t("create.futureTime"));
      setLoading(true);
      const { data, error } = await supabase
        .from("gatherings")
        .insert({
          business_id: v.business_id,
          table_id: v.table_id,
          host_id: user.id,
          subject: v.subject,
          description: v.description || null,
          venue_name: selectedBiz?.name ?? "",
          neighborhood: selectedBiz?.city ?? "",
          starts_at: iso,
          seats: v.seats,
          status: "proposed",
          origin: "user_proposed",
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

        {venues && venues.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">{t("create.noVenues")}</p>
            <Button asChild variant="outline" className="mt-4 rounded-full">
              <Link to="/venue/auth">{t("create.registerVenue")}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="grid gap-2">
              <Label>{t("create.venue")} *</Label>
              <Select
                value={form.business_id}
                onValueChange={(id) => setForm({ ...form, business_id: id, table_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("create.venuePh")} />
                </SelectTrigger>
                <SelectContent>
                  {(venues ?? []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} {v.city && <span className="text-muted-foreground">· {v.city}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t("create.table")} *</Label>
              <Select
                value={form.table_id}
                onValueChange={(id) => setForm({ ...form, table_id: id })}
                disabled={!selectedBiz}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedBiz ? t("create.tablePh") : t("create.tablePhFirst")} />
                </SelectTrigger>
                <SelectContent>
                  {(selectedBiz?.venue_tables ?? []).map((tbl) => (
                    <SelectItem key={tbl.id} value={tbl.id}>
                      {t("card.table")} {tbl.label} — {tbl.capacity} {t("create.tableSeats")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject">{t("create.subject")} *</Label>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="starts_at">{t("create.datetime")} *</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  required
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seats">{t("create.seats")} *</Label>
                <Input
                  id="seats"
                  type="number"
                  min={2}
                  max={30}
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
                />
              </div>
            </div>

            <p className="rounded-2xl bg-sunshine/40 px-4 py-3 text-xs text-foreground/80">
              {t("create.needsAdminApproval")}
            </p>

            <Button type="submit" size="lg" disabled={loading || !emailVerified} className="mt-2 h-12 rounded-full">
              {loading ? t("create.sending") : !emailVerified ? t("create.verifyToContinue") : t("create.propose")}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
