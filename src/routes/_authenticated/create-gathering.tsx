import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SavedLocationDialog } from "@/components/saved-location-dialog";
import { useT } from "@/i18n";

export const Route = createFileRoute("/_authenticated/create-gathering")({
  component: CreateGathering,
});

const schema = z.object({
  location: z.string().min(1, "Pick a location"),
  subject: z.string().trim().min(3).max(120),
  description: z.string().trim().max(800).optional().or(z.literal("")),
  starts_at: z.string().min(1, "Pick a date & time"),
  seats: z.coerce.number().int().min(2).max(30),
});

const ADD_NEW = "__add";

type PartnerOption = {
  key: string; // venue:<biz>:<table>
  bizId: string;
  tableId: string;
  bizName: string;
  bizCity: string | null;
  tableLabel: string;
  tableCapacity: number;
};

type SavedOption = {
  key: string; // saved:<id>
  id: string;
  label: string;
  address: string;
  city: string | null;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
};

function CreateGathering() {
  const { user } = useSession();
  const navigate = useNavigate();
  const t = useT();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    location: "",
    subject: "",
    description: "",
    starts_at: "",
    seats: 4,
  });

  const emailVerified = Boolean(user?.email_confirmed_at);

  const { data: profileCountry } = useQuery({
    queryKey: ["profile-country", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("country").eq("id", user!.id).maybeSingle();
      return (data?.country ?? null) as string | null;
    },
  });

  const { data: partners } = useQuery({
    queryKey: ["partner-options"],
    queryFn: async (): Promise<PartnerOption[]> => {
      const { listApprovedBusinesses } = await import("@/lib/public-data.functions");
      const bizList = await listApprovedBusinesses();
      const ids = bizList.map((b) => b.id);
      if (ids.length === 0) return [];
      const { data: tables } = await supabase
        .from("venue_tables")
        .select("id,label,capacity,business_id")
        .in("business_id", ids);
      const bizMap = new Map<string, { name: string; city: string | null }>();
      for (const b of bizList) bizMap.set(b.id, { name: b.name, city: b.city });
      return (tables ?? []).map((tbl) => {
        const biz = bizMap.get(tbl.business_id) ?? { name: "—", city: null };
        return {
          key: `venue:${tbl.business_id}:${tbl.id}`,
          bizId: tbl.business_id,
          tableId: tbl.id,
          bizName: biz.name,
          bizCity: biz.city,
          tableLabel: tbl.label,
          tableCapacity: tbl.capacity,
        };
      });
    },
  });

  const { data: saved } = useQuery({
    queryKey: ["my-saved-locations", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SavedOption[]> => {
      const { data, error } = await supabase
        .from("saved_locations")
        .select("id,label,address,city,neighborhood,lat,lng")
        .eq("user_id", user!.id)
        .eq("status", "approved")
        .order("label");
      if (error) throw error;
      return (data ?? []).map((r) => ({ key: `saved:${r.id}`, ...r }));
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!emailVerified) return toast.error(t("create.verifyFirst"));
    try {
      const v = schema.parse(form);
      const iso = new Date(v.starts_at).toISOString();
      if (new Date(iso) < new Date()) return toast.error(t("create.futureTime"));

      let insertRow: Record<string, unknown> = {
        host_id: user.id,
        subject: v.subject,
        description: v.description || null,
        starts_at: iso,
        seats: v.seats,
        status: "proposed",
        origin: "user_proposed",
      };

      if (v.location.startsWith("venue:")) {
        const [, bizId, tableId] = v.location.split(":");
        const p = partners?.find((x) => x.bizId === bizId && x.tableId === tableId);
        if (!p) return toast.error(t("create.pickLocation"));
        insertRow = {
          ...insertRow,
          business_id: bizId,
          table_id: tableId,
          venue_name: p.bizName,
          neighborhood: p.bizCity ?? "",
        };
      } else if (v.location.startsWith("saved:")) {
        const id = v.location.slice("saved:".length);
        const s = saved?.find((x) => x.id === id);
        if (!s) return toast.error(t("create.pickLocation"));
        insertRow = {
          ...insertRow,
          business_id: null,
          table_id: null,
          venue_name: s.label,
          neighborhood: s.neighborhood || s.city || "",
          address: s.address,
          city: s.city,
          lat: s.lat,
          lng: s.lng,
        };
      } else {
        return toast.error(t("create.pickLocation"));
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("gatherings")
        .insert(insertRow as never)
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

  const nothingToPick = (partners?.length ?? 0) === 0 && (saved?.length ?? 0) === 0;

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
            <Label>{t("create.location")} *</Label>
            <Select
              value={form.location}
              onValueChange={(v) => {
                if (v === ADD_NEW) {
                  setAddOpen(true);
                  return;
                }
                setForm({ ...form, location: v });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("create.locationPh")} />
              </SelectTrigger>
              <SelectContent>
                {(partners?.length ?? 0) > 0 && (
                  <SelectGroup>
                    <SelectLabel>{t("create.groupPartners")}</SelectLabel>
                    {partners!.map((p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.bizName} · {t("card.table")} {p.tableLabel}
                        {p.bizCity ? ` · ${p.bizCity}` : ""}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {(saved?.length ?? 0) > 0 && (
                  <SelectGroup>
                    <SelectLabel>{t("create.groupSaved")}</SelectLabel>
                    {saved!.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label}
                        {s.city ? ` · ${s.city}` : ""}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {nothingToPick ? null : <SelectSeparator />}
                <SelectItem value={ADD_NEW}>{t("create.addLocation")}</SelectItem>
              </SelectContent>
            </Select>
            {nothingToPick && (
              <p className="text-xs text-muted-foreground">{t("create.noLocationsYet")}</p>
            )}
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

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/venue/auth" className="underline">
              {t("create.registerVenue")}
            </Link>
          </p>
        </form>
      </main>

      <SavedLocationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        countryCode={profileCountry ?? undefined}
        onSaved={() => qc.invalidateQueries({ queryKey: ["my-saved-locations"] })}
      />
    </div>
  );
}
