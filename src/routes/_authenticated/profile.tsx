import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LogOut, Shield, X, LayoutDashboard, Store } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, citiesFor, neighborhoodsFor } from "@/lib/locations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useT } from "@/i18n";
import { BlockedUsersSection } from "@/components/blocked-users-section";
import { SavedLocationsSection } from "@/components/saved-locations-section";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your profile — Ideal Gathering" }] }),
  component: ProfilePage,
});

type SocialLinks = {
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
};

async function signedUrl(path: string | null | undefined) {
  if (!path) return null;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

function ProfilePage() {
  const t = useT();
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [country, setCountry] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [social, setSocial] = useState<SocialLinks>({});
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url, bio, city, neighborhood, country, interests, social_links")
      .eq("id", user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setCity(data.city ?? "");
        setNeighborhood(((data as { neighborhood?: string | null }).neighborhood ?? "") as string);
        setCountry(((data as { country?: string | null }).country ?? "") as string);
        setInterests(Array.isArray(data.interests) ? (data.interests as string[]) : []);
        setSocial((data.social_links as SocialLinks) ?? {});
        setAvatarPath(data.avatar_url ?? null);
        setAvatarUrl(await signedUrl(data.avatar_url));
      });
  }, [user]);

  function addInterest() {
    const v = interestInput.trim();
    if (!v) return;
    if (interests.includes(v)) {
      setInterestInput("");
      return;
    }
    if (interests.length >= 15) {
      toast.error(t("profile.interests.max"));
      return;
    }
    setInterests([...interests, v]);
    setInterestInput("");
  }

  function removeInterest(tag: string) {
    setInterests(interests.filter((i) => i !== tag));
  }

  async function saveProfile() {
    if (!user) return;
    if (bio.length > 500) {
      toast.error(t("profile.bio.max"));
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          city: city.trim() || null,
          neighborhood: neighborhood.trim() || null,
          country: country || null,
          interests: interests,
          social_links: social,
        } as never)
        .eq("id", user.id);
      if (error) throw error;
      toast.success(t("profile.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file: File): Promise<string> {
    if (!user) throw new Error("No user");
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) throw upErr;
    return path;
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploadingAvatar(true);
      const path = await uploadImage(file);
      const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      if (error) throw error;
      setAvatarPath(path);
      setAvatarUrl(await signedUrl(path));
      toast.success(t("profile.avatarUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setUploadingAvatar(false);
      if (avatarRef.current) avatarRef.current.value = "";
    }
  }

  async function deleteAccount() {
    if (!user) return;
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      toast.error(t("profile.delete.typeMismatch"));
      return;
    }
    try {
      setDeleting(true);
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-own-account`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete account");
      }
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      toast.success(t("profile.delete.done"));
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setDeleting(false);
    }
  }

  const initial = (displayName || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl">{t("profile.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

        {/* Avatar */}
        <section className="mt-8 rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-muted">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-display">{initial}</span>
              )}
            </div>
            <div>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => avatarRef.current?.click()}
                disabled={uploadingAvatar}
                className="rounded-full"
              >
                {uploadingAvatar ? "…" : t("profile.uploadAvatar")}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">{t("profile.avatarHint")}</p>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">{t("profile.about")}</h2>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dn">{t("profile.displayName")}</Label>
              <Input id="dn" value={displayName} maxLength={80} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">{t("profile.bio")}</Label>
              <Textarea
                id="bio"
                value={bio}
                maxLength={500}
                rows={4}
                placeholder={t("profile.bioPh")}
                onChange={(e) => setBio(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{bio.length}/500</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t("profile.country")}</Label>
                <Select
                  value={country || undefined}
                  onValueChange={(v) => {
                    setCountry(v);
                    if (!citiesFor(v).includes(city)) {
                      setCity("");
                      setNeighborhood("");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("profile.selectCountry")} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("profile.city")}</Label>
                {citiesFor(country).length > 0 ? (
                  <Select
                    value={city || undefined}
                    onValueChange={(v) => {
                      setCity(v);
                      if (!neighborhoodsFor(v).includes(neighborhood)) setNeighborhood("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("profile.selectCity")} />
                    </SelectTrigger>
                    <SelectContent>
                      {citiesFor(country).map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={city}
                    maxLength={120}
                    placeholder={t("profile.cityPh")}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setNeighborhood("");
                    }}
                  />
                )}
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>{t("profile.neighborhood")}</Label>
                {neighborhoodsFor(city).length > 0 ? (
                  <Select value={neighborhood || undefined} onValueChange={setNeighborhood}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("profile.selectNeighborhood")} />
                    </SelectTrigger>
                    <SelectContent>
                      {neighborhoodsFor(city).map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={neighborhood}
                    maxLength={120}
                    placeholder={t("profile.neighborhoodPh")}
                    onChange={(e) => setNeighborhood(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Interests */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">{t("profile.interests")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("profile.interests.hint")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {interests.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeInterest(tag)}
                  className="ms-1 rounded-full hover:bg-primary/20"
                  aria-label={t("profile.interests.remove")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Input
              value={interestInput}
              placeholder={t("profile.interests.add")}
              maxLength={40}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addInterest();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addInterest} className="rounded-full">
              {t("profile.interests.addBtn")}
            </Button>
          </div>
        </section>

        {/* Social links */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">{t("profile.social")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="ig">Instagram</Label>
              <Input
                id="ig"
                value={social.instagram ?? ""}
                placeholder="@username"
                maxLength={200}
                onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="li">LinkedIn</Label>
              <Input
                id="li"
                value={social.linkedin ?? ""}
                placeholder="linkedin.com/in/…"
                maxLength={200}
                onChange={(e) => setSocial({ ...social, linkedin: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tw">X / Twitter</Label>
              <Input
                id="tw"
                value={social.twitter ?? ""}
                placeholder="@username"
                maxLength={200}
                onChange={(e) => setSocial({ ...social, twitter: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ws">{t("profile.website")}</Label>
              <Input
                id="ws"
                type="url"
                value={social.website ?? ""}
                placeholder="https://…"
                maxLength={300}
                onChange={(e) => setSocial({ ...social, website: e.target.value })}
              />
            </div>
          </div>
        </section>

        <div className="mt-6 flex justify-end">
          <Button onClick={saveProfile} disabled={saving} size="lg" className="rounded-full">
            {saving ? "…" : t("profile.save")}
          </Button>
        </div>

        <SavedLocationsSection countryCode={country || null} />

        <BlockedUsersSection />

        {/* Account actions */}
        <section className="mt-8 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">{t("profile.account") || "Account"}</h2>
          {isAdmin && (
            <div className="mt-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                {t("profile.switchViews") || "Switch views (admin only)"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link to="/dashboard">
                    <LayoutDashboard className="me-2 h-4 w-4" />
                    {t("nav.dashboard")}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link to="/venue/dashboard">
                    <Store className="me-2 h-4 w-4" />
                    {t("venueDash.eyebrow") || "Venue"}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link to="/admin">
                    <Shield className="me-2 h-4 w-4" />
                    {t("nav.admin")}
                  </Link>
                </Button>
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {isAdmin && (
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/admin">
                  <Shield className="me-2 h-4 w-4" />
                  {t("nav.admin")}
                </Link>
              </Button>
            )}
            <Button variant="outline" className="rounded-full" onClick={handleSignOut}>
              <LogOut className="me-2 h-4 w-4" />
              {t("nav.signOut")}
            </Button>
          </div>
        </section>


        {/* Danger zone */}
        <section className="mt-8 rounded-3xl border border-destructive/40 bg-card p-6">
          <h2 className="font-display text-xl text-destructive">{t("profile.danger")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("profile.delete.body")}</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-4 rounded-full">
                {t("profile.delete.button")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("profile.delete.confirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("profile.delete.confirmBody")}</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="ct">{t("profile.delete.typeToConfirm")}</Label>
                <Input id="ct" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("profile.delete.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    deleteAccount();
                  }}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "…" : t("profile.delete.confirmButton")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>
    </div>
  );
}
