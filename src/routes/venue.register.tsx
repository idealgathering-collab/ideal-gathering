import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Store, Upload } from "lucide-react";
import { ClientOnly } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationMapPicker, type MapLocationValue } from "@/components/location-map-picker";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n";
import { requireVenueRegistrationAccess } from "@/lib/beta-gate";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";

export const Route = createFileRoute("/venue/register")({
  ssr: false,
  beforeLoad: () => requireVenueRegistrationAccess(),
  head: () => ({
    meta: [
      { title: "Register your venue — Ideal Gathering" },
      { name: "description", content: "Register your venue for Ideal Gathering before launch." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VenueRegisterPage,
});

const schema = z.object({
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

function VenueRegisterPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const t = useT();
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    lat: 0,
    lng: 0,
    street_number: "",
    description_extra: "",
    phone: "",
    mobile: "",
    cover_url: "",
    menu_link: "",
  });
  const [picked, setPicked] = useState<MapLocationValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) return toast.error(t("venueDash.imageTooLarge"));
    try {
      setUploading(true);
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/business-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, TEN_YEARS);
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
    if (!user) return;
    try {
      const v = schema.parse({ ...form, menu_link: form.menu_link || "" });
      setSaving(true);
      const { error } = await supabase.from("businesses").insert({
        ...v,
        menu_link: v.menu_link || null,
        owner_id: user.id,
        status: "pending",
      });
      if (error) throw error;
      toast.success(t("venueDash.saved"));
      navigate({ to: "/pending", search: { as: "venue" }, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("venueDash.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate({ to: "/" })}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logoAsset.url} alt="" className="h-9 w-9 rounded-full object-contain" />
              <span className="font-display text-lg">Ideal <span className="italic text-primary">Gathering</span></span>
            </Link>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 pb-24">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium">
            <Store className="h-3.5 w-3.5" /> Venue registration
          </div>
          <h1 className="font-display mt-4 text-3xl sm:text-4xl">Register your business for launch</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Complete your venue registration now. Your venue profile and dashboard tools will stay locked until Ideal Gathering launches.
          </p>
        </div>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <form onSubmit={submit} className="grid gap-5">
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
              <Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required minLength={10} maxLength={1200} rows={4} />
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
                <Input id="menu_link" type="url" value={form.menu_link} onChange={(e) => setForm({ ...form, menu_link: e.target.value })} placeholder="https://…" maxLength={600} />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="mt-2 h-11 rounded-full">
              {saving ? t("common.loading") : t("venueDash.registerBusiness")}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
