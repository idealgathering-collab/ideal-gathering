import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LogOut, Shield, X, LayoutDashboard, Store, Settings as SettingsIcon, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, citiesFor, neighborhoodsFor } from "@/lib/locations";
import { ALL_COUNTRIES } from "@/lib/countries";
import { useT } from "@/i18n";
import { SavedLocationsSection } from "@/components/saved-locations-section";
import { ProfileHeader } from "@/components/profile-header";
import {
  INTEREST_CATEGORIES, 
  MAX_INTERESTS, 
  interestLabel 
} from "@/lib/interests";
import { INTENTION_OPTIONS } from "@/lib/gathering-preferences";
import { GATHERING_TYPES, type GatheringType } from "@/lib/gathering-types";
import { ageFromDob } from "@/lib/age";
import { useQueryClient } from "@tanstack/react-query";
import { setAdminPreview } from "@/lib/roles";
import { ProfileCard, ProfileCardSkeleton } from "@/components/profile-card";
import { loadProfileCard } from "@/lib/profile-card.functions";
import type { ProfileCardData } from "@/lib/profile-card";

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

const cardClass = "rounded-3xl border border-border/60 bg-card p-4 sm:p-6";

const NATIONALITY_NONE = "__none__";

const GENDER_OPTIONS = ["female", "male", "non_binary", "other", "prefer_not_to_say"] as const;

function maxDobString() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

function GroupHeading({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-4 px-1">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

function ProfilePage() {
  const t = useT();
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [country, setCountry] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [intentions, setIntentions] = useState<string[]>([]);
  const [gatheringTypes, setGatheringTypes] = useState<string[]>([]);
  const [traitSpark, setTraitSpark] = useState<number | null>(null);
  const [traitCuriosity, setTraitCuriosity] = useState<number | null>(null);
  const [traitWarmth, setTraitWarmth] = useState<number | null>(null);
  const [traitDepth, setTraitDepth] = useState<number | null>(null);
  
  const [social, setSocial] = useState<SocialLinks>({});
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Profile card card state
  const [profileCard, setProfileCard] = useState<ProfileCardData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

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

  // Load profile card for the card
  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    loadProfileCard(user.id)
      .then((profile) => {
        setProfileCard(profile);
        // Pre-fill form fields from profile
        if (profile) {
          setDisplayName(profile.displayName ?? "");
          setBio(profile.bio ?? "");
          setCity(profile.city ?? "");
          setNeighborhood(profile.neighborhood ?? "");
          setCountry(profile.country ?? "");
          setInterests(profile.interests ?? []);
          setIntentions(profile.intentions ?? []);
          setTraitSpark(profile.traitSpark ?? null);
          setTraitCuriosity(profile.traitCuriosity ?? null);
          setTraitWarmth(profile.traitWarmth ?? null);
          setTraitDepth(profile.traitDepth ?? null);
          setAvatarPath(profile.avatarUrl ?? null);
          setAvatarUrl(profile.avatarUrl ?? null);
        }
      })
      .catch((err) => {
        console.error("Failed to load profile card:", err);
        setProfileCard(null);
      })
      .finally(() => {
        setProfileLoading(false);
      });
  }, [user?.id]);

  // Load additional profile data (for fields not in profile card)
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select(
        "display_name, avatar_url, bio, city, neighborhood, country, interests, social_links, date_of_birth, nationality, gender",
      )
      .eq("id", user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        // Only update if we haven't loaded from profile card yet
        if (!profileCard) {
          setDisplayName(data.display_name ?? "");
          setBio(data.bio ?? "");
          setDob(((data as { date_of_birth?: string | null }).date_of_birth ?? "") as string);
          setNationality(((data as { nationality?: string | null }).nationality ?? "") as string);
          setGender(((data as { gender?: string | null }).gender ?? "") as string);
          setCity(data.city ?? "");
          setNeighborhood(((data as { neighborhood?: string | null }).neighborhood ?? "") as string);
          setCountry(((data as { country?: string | null }).country ?? "") as string);
          setInterests(Array.isArray(data.interests) ? (data.interests as string[]) : []);
          setSocial((data.social_links as SocialLinks) ?? {});
          setAvatarPath(data.avatar_url ?? null);
          setAvatarUrl(await signedUrl(data.avatar_url));
        }
      });
    
    // Load gathering preferences (intentions and gathering_types)
    supabase
      .from("user_gathering_preferences")
      .select("intentions, gathering_types")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data: prefsData }) => {
        if (prefsData) {
          setIntentions(Array.isArray(prefsData.intentions) ? (prefsData.intentions as string[]) : []);
          setGatheringTypes(Array.isArray(prefsData.gathering_types) ? (prefsData.gathering_types as string[]) : []);
        }
      });
  }, [user, profileCard]);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  function toggleInterest(tag: string) {
    if (interests.includes(tag)) {
      setInterests(interests.filter((i) => i !== tag));
      return;
    }
    if (interests.length >= MAX_INTERESTS) {
      toast.error(t("profile.interests.max"));
      return;
    }
    setInterests([...interests, tag]);
  }

  function removeInterest(tag: string) {
    setInterests(interests.filter((i) => i !== tag));
  }

  function toggleIntention(value: string) {
    const has = intentions.includes(value);
    setIntentions(has ? intentions.filter((v) => v !== value) : [...intentions, value]);
  }

  function toggleGatheringType(value: string) {
    const has = gatheringTypes.includes(value);
    setGatheringTypes(has ? gatheringTypes.filter((v) => v !== value) : [...gatheringTypes, value]);
  }

  async function saveProfile() {
    if (!user) return;
    if (bio.length > 500) {
      toast.error(t("profile.bio.max"));
      return;
    }
    if (dob) {
      const age = ageFromDob(dob);
      if (age === null || age < 18) {
        toast.error(t("profile.minAge"));
        return;
      }
    }
    try {
      setSaving(true);
      
      // Save profile data
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          date_of_birth: dob || null,
          nationality: nationality || null,
          gender: gender || null,
          city: city.trim() || null,
          neighborhood: neighborhood.trim() || null,
          country: country || null,
          interests: interests,
          social_links: social,
        } as never)
        .eq("id", user.id);
      
      if (profileError) throw profileError;
      
      // Save gathering preferences (intentions and gathering_types)
      const { error: prefsError } = await supabase
        .from("user_gathering_preferences")
        .upsert({
          user_id: user.id,
          intentions: intentions,
          gathering_types: gatheringTypes,
          updated_at: new Date().toISOString(),
        } as never, { onConflict: "user_id" });
      
      if (prefsError) throw prefsError;
      
      toast.success(t("profile.saved"));
      // Refresh profile card after save
      loadProfileCard(user.id).then(setProfileCard);
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
      // Update profile card avatar
      setProfileCard(prev => prev ? { ...prev, avatarUrl: path } : null);
      toast.success(t("profile.avatarUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setUploadingAvatar(false);
      if (avatarRef.current) avatarRef.current.value = "";
    }
  }

  const countryName = COUNTRIES.find((c) => c.code === country)?.name ?? null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:pb-16 sm:pt-10">
        {/* Profile Card - Photo-first phone card (430px) - Dark theme to match image */}
        <div className="mb-10">
          {profileLoading ? (
            <ProfileCardSkeleton darkTheme={true} />
          ) : (
            <ProfileCard
              profile={profileCard}
              darkTheme={true}
              interactive={true}
              isSelf={true}
              onComplete={() => {
                // Navigate to onboarding to complete profile
                navigate({ to: "/onboarding" });
              }}
              onStoryItemClick={(item) => {
                navigate({ to: "/gatherings/$id", params: { id: item.gatheringId } });
              }}
            />
          )}
        </div>

        {/* Identity header - for editing */}
        <ProfileHeader
          displayName={displayName}
          email={user?.email}
          avatarUrl={avatarUrl}
          city={city}
          neighborhood={neighborhood}
          country={countryName}
          interests={interests}
          uploading={uploadingAvatar}
          onPickAvatar={() => avatarRef.current?.click()}
        >
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            onChange={onAvatarChange}
            className="hidden"
          />
        </ProfileHeader>

        {/* ── Your public info ───────────────────────── */}
        <div className="mt-10">
          <GroupHeading label={t("profile.group.public")} hint={t("profile.group.publicHint")} />

          <div className="grid gap-4">
            {/* About */}
            <section className={cardClass}>
              <h2 className="font-display text-xl">{t("profile.about")}</h2>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dn">{t("profile.displayName")}</Label>
                  <Input id="dn" value={displayName} maxLength={80} onChange={(e) => setDisplayName(e.target.value)} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="dob">{t("profile.dob")}</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dob}
                      max={maxDobString()}
                      onChange={(e) => setDob(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {dob && ageFromDob(dob) !== null
                        ? `${t("profile.age")} ${ageFromDob(dob)}`
                        : t("profile.dobHint")}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("profile.nationality")}</Label>
                    <Select
                      value={nationality || NATIONALITY_NONE}
                      onValueChange={(v) => setNationality(v === NATIONALITY_NONE ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("profile.selectNationality")} />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value={NATIONALITY_NONE}>{t("profile.nationalityNone")}</SelectItem>
                        {ALL_COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("profile.gender")}</Label>
                    <Select value={gender || undefined} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("profile.selectGender")} />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {t(`profile.gender.${g}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-sm font-medium">{t("profile.location")}</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
              </div>
            </section>

            {/* Interests */}
            <section className={cardClass}>
              <h2 className="font-display text-xl">{t("profile.interests")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("profile.interests.hint")}</p>
              {interests.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {interests.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                    >
                      {interestLabel(t, tag)}
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
              )}
              <div className="mt-5 space-y-4">
                {INTEREST_CATEGORIES.map((cat) => (
                  <div key={cat.id}>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t(`interest.cat.${cat.id}`)}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {cat.tags.map((tag) => {
                        const active = interests.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleInterest(tag)}
                            className={
                              active
                                ? "rounded-full border border-primary bg-primary px-3 py-1 text-sm text-primary-foreground"
                                : "rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                            }
                          >
                            {t(`interest.${tag}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Intentions */}
            <section className={cardClass}>
              <h2 className="font-display text-xl">{t("profile.intentions")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("profile.intentions.hint")}</p>
              {intentions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {intentions.map((intention) => (
                    <span
                      key={intention}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                    >
                      {t(`onboarding.prefs.intentions.${intention}`)}
                      <button
                        type="button"
                        onClick={() => toggleIntention(intention)}
                        className="ms-1 rounded-full hover:bg-primary/20"
                        aria-label={t("common.remove")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {INTENTION_OPTIONS.map((intention) => {
                  const active = intentions.includes(intention);
                  return (
                    <button
                      key={intention}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleIntention(intention)}
                      className={
                        active
                          ? "rounded-full border border-primary bg-primary px-3 py-1 text-sm text-primary-foreground"
                          : "rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                      }
                    >
                      {t(`onboarding.prefs.intentions.${intention}`)}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Gathering Types */}
              <section className={cardClass}>
                <h2 className="font-display text-xl">{t("profile.gatheringTypes")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("profile.gatheringTypes.hint")}</p>
                {gatheringTypes.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {gatheringTypes.map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                      >
                        {t(`gatheringType.${type}`)}
                        <button
                          type="button"
                          onClick={() => toggleGatheringType(type)}
                          className="ms-1 rounded-full hover:bg-primary/20"
                          aria-label={t("common.remove")}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  {GATHERING_TYPES.map((type: GatheringType) => {
                    const active = gatheringTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleGatheringType(type)}
                        className={
                          active
                            ? "rounded-full border border-primary bg-primary px-3 py-1 text-sm text-primary-foreground"
                            : "rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                        }
                      >
                        {t(`gatheringType.${type}`)}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Trait Scores / Personality */}
              <section className={cardClass}>
                <h2 className="font-display text-xl">{t("profile.personality")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("profile.personality.hint")}</p>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {[
                    { key: "spark", label: t("profile.aura.spark"), value: traitSpark, color: "#8B5CF6" },
                    { key: "curiosity", label: t("profile.aura.curiosity"), value: traitCuriosity, color: "#F59E0B" },
                    { key: "warmth", label: t("profile.aura.warmth"), value: traitWarmth, color: "#10B981" },
                    { key: "depth", label: t("profile.aura.depth"), value: traitDepth, color: "#3B82F6" },
                  ].map((trait) => (
                    <div key={trait.key} className="flex items-center gap-3">
                      <span className="text-xl" style={{ color: trait.color }}>✨</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{trait.label}</span>
                          <span className="text-sm font-bold">{trait.value ?? 0}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${trait.value ?? 0}%`,
                              backgroundColor: trait.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full"
                    onClick={() => navigate({ to: "/onboarding", search: { step: "qintro" } })}
                  >
                    {t("profile.retakeQuiz")}
                  </Button>
                </div>
              </section>
            </div>

            {/* Social links */}
              <section className={cardClass}>
                <h2 className="font-display text-xl">{t("profile.social")}</h2>
                <div className="mt-4 grid gap-4">
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

            <div className="flex justify-stretch sm:justify-end">
              <Button
                onClick={saveProfile}
                disabled={saving}
                size="lg"
                className="w-full rounded-full sm:w-auto"
              >
                {saving ? "…" : t("profile.save")}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Your account ───────────────────────────── */}
        <div className="mt-12">
          <GroupHeading label={t("profile.group.account")} hint={t("profile.group.accountHint")} />

          <div className="rounded-3xl bg-muted/30 p-3 sm:p-4">
            <div className="grid gap-3">
              <SavedLocationsSection countryCode={country || null} className={cardClass} />

              {/* Account actions */}
              <section className={cardClass}>
                <h2 className="font-display text-xl">{t("profile.account") || "Account"}</h2>

                {isAdmin && (
                  <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      {t("profile.switchViews") || "Switch views (admin only)"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link to="/dashboard" onClick={() => setAdminPreview(true)}>
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
                        <Link to="/admin" onClick={() => setAdminPreview(false)}>
                          <Shield className="me-2 h-4 w-4" />
                          {t("nav.admin")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                <Link
                  to="/settings"
                  className="mt-4 flex items-center gap-3 rounded-2xl border border-border/60 p-4 transition hover:bg-muted/40"
                >
                  <SettingsIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{t("profile.settingsLink")}</span>
                    <span className="block text-xs text-muted-foreground">{t("profile.settingsHint")}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
                </Link>

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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
