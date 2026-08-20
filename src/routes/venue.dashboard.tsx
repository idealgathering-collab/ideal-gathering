import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  Store,
  Plus,
  Trash2,
  Zap,
  LogOut,
  Upload,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ClientOnly } from "@tanstack/react-router";
import { LocationMapPicker, type MapLocationValue } from "@/components/location-map-picker";
import { MenuSection } from "@/components/menu-section";
import { VerifyEmailBanner } from "@/components/verify-email-banner";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationsBell } from "@/components/notifications-bell";
import { useT } from "@/i18n";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";

export const Route = createFileRoute("/venue/dashboard")({
  component: VenueDashboard,
});

const bizSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1200),
  address: z.string().trim().min(3).max(300),
  city: z.string().trim().min(1).max(120),
  lat: z.number(),
  lng: z.number(),
  street_number: z.string().trim().min(1, "Add street / house number").max(80),
  description_extra: z.string().trim().min(1, "Add a short description").max(200),
  phone: z.string().trim().min(5).max(40),
  mobile: z.string().trim().min(5).max(40),
  cover_url: z.string().url().max(600),
  menu_link: z.string().url().max(600).optional().or(z.literal("")),
});

function VenueDashboard() {
  const { user, loading: sessLoading } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const t = useT();
  const [roleChecked, setRoleChecked] = useState(false);

  // gate: venue role required (admins may also view the venue portal)
  useEffect(() => {
    if (sessLoading) return;
    if (!user) {
      navigate({ to: "/venue/auth" });
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["venue", "admin"])
      .then(({ data }) => {
        if (!data || data.length === 0) {
          toast.error(t("venueAuth.notVenue"));
          navigate({ to: "/" });
        } else {
          setRoleChecked(true);
        }
      });
  }, [user, sessLoading, navigate, t]);

  const { data: biz, isLoading: bizLoading } = useQuery({
    queryKey: ["venue-biz", user?.id],
    enabled: !!user && roleChecked,
    queryFn: async () => {
      const { getMyBusiness } = await import("@/lib/business.functions");
      return await getMyBusiness();
    },

  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/venue/auth", replace: true });
  }

  if (!roleChecked || sessLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="" className="h-9 w-9 rounded-full object-contain animate-logo-spin" />
            <span className="font-display text-lg">
              Ideal <span className="italic text-primary">Gathering</span>
              <span className="ms-1 text-xs text-muted-foreground">· {t("venueAuth.for")}</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {user && <NotificationsBell />}
            <Button variant="ghost" size="icon" onClick={signOut} aria-label={t("nav.signOut")} className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 pb-24">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("venueDash.eyebrow")}</p>
          <h1 className="font-display text-3xl sm:text-4xl">
            {biz?.name ?? t("venueDash.newVenue")}
          </h1>
          {biz && (
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={biz.status} />
            </div>
          )}
        </div>

        {user && !user.email_confirmed_at && (
          <div className="mb-6">
            <VerifyEmailBanner email={user.email} />
          </div>
        )}

        {bizLoading ? (
          <div className="py-16 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : biz ? (
          <>
            {biz.status === "pending" && (
              <div className="mb-6 rounded-2xl border border-sunshine/60 bg-sunshine/20 px-4 py-3 text-sm">
                {t("venueDash.pendingNote")}
              </div>
            )}
            {biz.status === "rejected" && (
              <div className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
                {t("venueDash.rejectedNote")}
              </div>
            )}
            <BusinessForm business={biz} userId={user!.id} onSaved={() => qc.invalidateQueries({ queryKey: ["venue-biz", user!.id] })} />
            <TablesSection business={biz} />
            <MenuSection businessId={biz.id} isOwner={true} />
          </>
        ) : (
          <BusinessForm business={null} userId={user!.id} onSaved={() => qc.invalidateQueries({ queryKey: ["venue-biz", user!.id] })} />
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useT();
  const cls =
    status === "approved"
      ? "bg-primary text-primary-foreground"
      : status === "rejected"
      ? "bg-destructive text-destructive-foreground"
      : "bg-sunshine text-sunshine-foreground";
  const label =
    status === "approved" ? t("venueDash.approved") : status === "rejected" ? t("venueDash.rejected") : t("venueDash.pending");
  return <Badge className={`${cls} rounded-full`}>{label}</Badge>;
}

type BizRow = {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  street_number: string;
  description_extra: string;
  phone: string;
  mobile: string;
  cover_url: string;
  menu_link: string | null;
  status: string;
  venue_tables?: { id: string; label: string; capacity: number }[];
};

function BusinessForm({
  business,
  userId,
  onSaved,
}: {
  business: BizRow | null;
  userId: string;
  onSaved: () => void;
}) {
  const t = useT();
  const [form, setForm] = useState({
    name: business?.name ?? "",
    description: business?.description ?? "",
    address: business?.address ?? "",
    city: business?.city ?? "",
    lat: business?.lat ?? 0,
    lng: business?.lng ?? 0,
    street_number: business?.street_number ?? "",
    description_extra: business?.description_extra ?? "",
    phone: business?.phone ?? "",
    mobile: business?.mobile ?? "",
    cover_url: business?.cover_url ?? "",
    menu_link: business?.menu_link ?? "",
  });
  const [picked, setPicked] = useState<MapLocationValue | null>(
    business && business.lat && business.lng
      ? {
          display_name: business.address,
          address: business.address,
          city: business.city,
          lat: business.lat,
          lng: business.lng,
          street_number: business.street_number ?? "",
          description: business.description_extra ?? "",
        }
      : null,
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error(t("venueDash.imageTooLarge"));
    try {
      setUploading(true);
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/business-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (!signed?.signedUrl) throw new Error("signed url failed");
      setForm((f) => ({ ...f, cover_url: signed.signedUrl }));
      toast.success(t("venueDash.imageUploaded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const v = bizSchema.parse({
        ...form,
        menu_link: form.menu_link || "",
      });
      setSaving(true);
      const payload = {
        ...v,
        menu_link: v.menu_link || null,
        owner_id: userId,
      };
      if (business) {
        const { error } = await supabase.from("businesses").update(payload).eq("id", business.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("businesses").insert({ ...payload, status: "pending" });
        if (error) throw error;
      }
      toast.success(t("venueDash.saved"));
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("venueDash.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <Store className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl">{business ? t("venueDash.editBusiness") : t("venueDash.registerBusiness")}</h2>
      </div>

      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-2">
          <Label>{t("venueDash.profilePic")} *</Label>
          <div className="flex items-center gap-4">
            {form.cover_url ? (
              <img src={form.cover_url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <Store className="h-6 w-6" />
              </div>
            )}
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              <span className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-sm hover:bg-muted">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? t("common.loading") : t("venueDash.uploadImage")}
              </span>
            </label>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">{t("venueDash.name")} *</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={120} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="desc">{t("venueDash.description")} *</Label>
          <Textarea
            id="desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            minLength={10}
            maxLength={1200}
            rows={4}
          />
        </div>


        <div className="grid gap-2">
          <Label>{t("venueDash.address")} *</Label>
          <ClientOnly fallback={<div className="h-72 rounded-2xl border border-border bg-muted/30" />}>
            <LocationMapPicker
              value={picked}
              onChange={(v) => {
                setPicked(v);
                if (v) {
                  setForm((f) => ({
                    ...f,
                    address: v.address,
                    city: v.city || f.city,
                    lat: v.lat,
                    lng: v.lng,
                    street_number: v.street_number,
                    description_extra: v.description,
                  }));
                }
              }}
              countryCode="tr"
            />
          </ClientOnly>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="city">{t("venueDash.city")} *</Label>
            <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required maxLength={120} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">{t("venueDash.phone")} *</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required maxLength={40} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mobile">{t("venueDash.mobile")} *</Label>
            <Input id="mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required maxLength={40} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="menu_link">{t("venueDash.menuLink")}</Label>
            <Input
              id="menu_link"
              type="url"
              value={form.menu_link}
              onChange={(e) => setForm({ ...form, menu_link: e.target.value })}
              placeholder="https://…"
              maxLength={600}
            />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="mt-2 h-11 rounded-full">
          {saving ? t("common.loading") : business ? t("venueDash.saveChanges") : t("venueDash.registerBusiness")}
        </Button>
      </form>
    </section>
  );
}

function TablesSection({ business }: { business: BizRow }) {
  const t = useT();
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [cap, setCap] = useState(4);
  const [activateFor, setActivateFor] = useState<{ id: string; label: string } | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const next = label.trim().slice(0, 20);
    if (!next) return;
    const dup = (business.venue_tables ?? []).some(
      (tbl) => tbl.label.trim().toLowerCase() === next.toLowerCase(),
    );
    if (dup) return toast.error(t("biz.duplicateLabel"));

    const { error } = await supabase.from("venue_tables").insert({
      business_id: business.id,
      label: next,
      capacity: Math.max(1, Math.min(30, cap)),
    });
    if (error) {
      const isDup =
        (error as { code?: string }).code === "23505" ||
        error.message.includes("venue_tables_business_label_ci_uidx");
      return toast.error(isDup ? t("biz.duplicateLabel") : error.message);
    }
    setLabel("");
    toast.success(t("biz.tableAdded"));
    qc.invalidateQueries({ queryKey: ["venue-biz"] });
  }
  async function remove(id: string, tableLabel: string) {
    const { error } = await supabase.from("venue_tables").delete().eq("id", id);
    if (error) {
      const locked = /TABLE_LOCKED:\s*(.*)$/s.exec(error.message);
      if (locked) {
        return toast.error(`${t("biz.tableLocked")} ${tableLabel} — ${locked[1]?.trim()}`);
      }
      return toast.error(error.message);
    }
    toast.success(t("biz.tableRemoved"));
    qc.invalidateQueries({ queryKey: ["venue-biz"] });
  }

  const canActivate = business.status === "approved";

  return (
    <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-2xl">{t("biz.tables")}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(business.venue_tables ?? []).map((tbl) => (
          <div key={tbl.id} className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-xl">{t("biz.tableLabel")} {tbl.label}</div>
                <div className="text-xs text-muted-foreground">{tbl.capacity} {t("biz.tableSeats")}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(tbl.id, tbl.label)} aria-label={t("biz.removeTable")}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="sm"
              className="mt-3 w-full rounded-full"
              onClick={() => setActivateFor({ id: tbl.id, label: tbl.label })}
              disabled={!canActivate}
              title={!canActivate ? t("venueDash.activateNeedsApproval") : undefined}
            >
              <Zap className="me-1 h-4 w-4" /> {t("venueDash.activate")}
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-border bg-muted/40 p-4">
        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">{t("biz.newLabel")}</label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={20} placeholder={t("biz.newLabelPh")} className="w-32" />
        </div>
        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">{t("biz.newCapacity")}</label>
          <Input type="number" min={1} max={30} value={cap} onChange={(e) => setCap(Number(e.target.value))} className="w-24" />
        </div>
        <Button type="submit" className="rounded-full">
          <Plus className="me-1 h-4 w-4" /> {t("biz.addTable")}
        </Button>
      </form>

      <ActivateDialog
        table={activateFor}
        businessId={business.id}
        userId={business.venue_tables ? undefined : undefined}
        onClose={() => setActivateFor(null)}
      />
    </section>
  );
}

function ActivateDialog({
  table,
  businessId,
  onClose,
}: {
  table: { id: string; label: string } | null;
  businessId: string;
  userId?: string;
  onClose: () => void;
}) {
  const t = useT();
  const qc = useQueryClient();
  const { user } = useSession();
  const [subject, setSubject] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [seats, setSeats] = useState(4);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!table) {
      setSubject("");
      setStartsAt("");
      setSeats(4);
    }
  }, [table]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !table) return;
    try {
      setSaving(true);
      const iso = startsAt ? new Date(startsAt).toISOString() : new Date().toISOString();
      const ends = new Date(new Date(iso).getTime() + 2 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("gatherings")
        .insert({
          business_id: businessId,
          table_id: table.id,
          host_id: user.id,
          subject: subject.trim().slice(0, 120),
          starts_at: iso,
          ends_at: ends,
          seats: Math.max(2, Math.min(30, seats)),
          status: "approved",
          origin: "venue_activated",
          venue_name: "",
          neighborhood: "",
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success(t("venueDash.activated"));
      qc.invalidateQueries({ queryKey: ["explore-gatherings"] });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!table} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("venueDash.activateTitle")} {table?.label}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="subj">{t("create.subject")} *</Label>
            <Input id="subj" value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={3} maxLength={120} placeholder={t("create.subjectPh")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="st">{t("venueDash.startsAt")}</Label>
              <Input id="st" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              <p className="text-xs text-muted-foreground">{t("venueDash.startsAtHint")}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seats">{t("create.seats")}</Label>
              <Input id="seats" type="number" min={2} max={30} value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving} className="rounded-full">
              <Zap className="me-1 h-4 w-4" /> {saving ? t("common.loading") : t("venueDash.activate")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
