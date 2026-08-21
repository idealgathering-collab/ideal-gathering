import { Camera, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

/**
 * Identity banner at the top of the profile page.
 * Purely presentational — the avatar input/handlers stay owned by the page.
 */
export function ProfileHeader({
  displayName,
  email,
  avatarUrl,
  city,
  neighborhood,
  country,
  interests,
  uploading,
  onPickAvatar,
  children,
}: {
  displayName: string;
  email?: string | null;
  avatarUrl: string | null;
  city?: string | null;
  neighborhood?: string | null;
  country?: string | null;
  interests: string[];
  uploading: boolean;
  onPickAvatar: () => void;
  /** Hidden file input rendered by the page. */
  children?: React.ReactNode;
}) {
  const t = useT();
  const name = displayName.trim() || (email ?? "").split("@")[0] || t("profile.title");
  const initial = (displayName || email || "?").slice(0, 1).toUpperCase();
  const locationLine = [neighborhood, city, country].filter(Boolean).join(" · ");
  const shown = interests.slice(0, 5);
  const rest = interests.length - shown.length;

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <div className="h-24 bg-gradient-hero sm:h-28" />
      <div className="px-4 pb-6 sm:px-6">
        <div className="-mt-12 flex flex-col items-center gap-4 text-center sm:-mt-14 sm:flex-row sm:items-end sm:text-start">
          <div className="relative shrink-0">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-card bg-muted sm:h-28 sm:w-28">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-3xl">{initial}</span>
              )}
            </div>
            {children}
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={onPickAvatar}
              disabled={uploading}
              aria-label={t("profile.uploadAvatar")}
              title={t("profile.uploadAvatar")}
              className="absolute bottom-0 end-0 h-9 w-9 rounded-full border border-border shadow-soft"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          <div className="min-w-0 flex-1 sm:pb-1">
            <h1 className="truncate font-display text-2xl sm:text-3xl">{name}</h1>
            {locationLine && (
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{locationLine}</span>
              </p>
            )}
            {email && <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p>}
          </div>
        </div>

        {shown.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {shown.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
              >
                {tag}
              </span>
            ))}
            {rest > 0 && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                +{rest}
              </span>
            )}
          </div>
        )}
        <p className="mt-3 text-center text-xs text-muted-foreground sm:text-start">
          {t("profile.avatarHint")}
        </p>
      </div>
    </section>
  );
}
