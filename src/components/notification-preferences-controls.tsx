import { useEffect, useRef, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { useI18n } from "@/i18n";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { notificationPreferencesStore } from "@/lib/notification-preferences-store";
import type { NotificationPreferences, NotificationToggle } from "@/lib/notification-preferences";

const copy = {
  fa: {
    enabled: "دریافت اعلان‌ها",
    scope: "این انتخاب‌ها برای همهٔ دستگاه‌های شماست. خاموش‌کردن فقط ارسال اعلان را متوقف می‌کند.",
    gathering_reminders: "یادآوری دورهمی‌ها",
    gathering_updates: "تغییر، لغو و تأیید پیوستن به دورهمی",
    chat_messages: "پیام‌های دورهمی",
    account_venue_status: "وضعیت حساب و محل",
    language: "زبان اعلان‌ها",
    loading: "در حال دریافت تنظیمات…",
    saving: "در حال ذخیره…",
    saved: "ذخیره شد",
    error: "تنظیمات ذخیره نشد. اتصال را بررسی کنید و دوباره تلاش کنید.",
    loadError: "تنظیمات دریافت نشد. برای تلاش مجدد بزنید.",
    retry: "تلاش مجدد",
  },
  en: {
    enabled: "Receive notifications",
    scope:
      "These choices apply to all your devices. Turning them off only stops push notifications.",
    gathering_reminders: "Gathering reminders",
    gathering_updates: "Gathering updates, cancellations and join confirmations",
    chat_messages: "Gathering messages",
    account_venue_status: "Account and venue status",
    language: "Notification language",
    loading: "Loading preferences…",
    saving: "Saving…",
    saved: "Saved",
    error: "Could not save. Check your connection and try again.",
    loadError: "Could not load preferences. Please try again.",
    retry: "Try again",
  },
};
const toggles: NotificationToggle[] = [
  "enabled",
  "gathering_reminders",
  "gathering_updates",
  "chat_messages",
  "account_venue_status",
];

export function NotificationPreferencesControls() {
  const { user } = useSession();
  const userId = user?.id;
  const { lang } = useI18n();
  const text = copy[lang === "fa" ? "fa" : "en"];
  const [state, setState] = useState<{ userId: string; preferences: NotificationPreferences }>();
  const [status, setStatus] = useState<"loading" | "saving" | "saved" | "error" | "loadError">(
    "loading",
  );
  const [retry, setRetry] = useState(0);
  const saving = useRef(false);
  const currentUser = useRef(userId);
  currentUser.current = userId;
  const preferences = state && state.userId === userId ? state.preferences : undefined;

  useEffect(() => {
    let active = true;
    if (!userId) return;
    setState(undefined);
    setStatus("loading");
    void notificationPreferencesStore(userId)
      .read()
      .then((preferences) => {
        if (active) {
          setState({ userId, preferences });
          setStatus("saved");
        }
      })
      .catch(() => {
        if (active) setStatus("loadError");
      });
    return () => {
      active = false;
    };
  }, [userId, retry]);

  async function save(patch: Partial<NotificationPreferences>) {
    if (!userId || !preferences || saving.current) return;
    saving.current = true;
    setStatus("saving");
    try {
      const saved = await notificationPreferencesStore(userId).save(patch);
      if (currentUser.current === userId) {
        setState({ userId, preferences: saved });
        setStatus("saved");
      }
    } catch {
      if (currentUser.current === userId) setStatus("error");
    } finally {
      saving.current = false;
    }
  }

  if (!userId) return null;
  return (
    <div className="mt-5 border-t border-border/60 pt-4" dir={lang === "fa" ? "rtl" : "ltr"}>
      <p className="text-sm text-muted-foreground">{text.scope}</p>
      {preferences && (
        <div className="mt-3 grid gap-1">
          {toggles.map((field) => (
            <label
              key={field}
              className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-2 text-sm"
            >
              <span className={field === "enabled" ? "font-semibold" : ""}>{text[field]}</span>
              <Switch
                dir="ltr"
                aria-label={text[field]}
                checked={preferences[field]}
                disabled={status === "saving" || (field !== "enabled" && !preferences.enabled)}
                onCheckedChange={(checked) => void save({ [field]: checked })}
              />
            </label>
          ))}
          <label className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span>{text.language}</span>
            <select
              aria-label={text.language}
              value={preferences.language}
              disabled={status === "saving"}
              className="min-h-11 rounded-xl border border-input bg-background px-3 text-foreground"
              onChange={(event) =>
                void save({ language: event.target.value === "en" ? "en" : "fa" })
              }
            >
              <option value="fa">فارسی</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      )}
      <p role="status" className="mt-3 text-sm text-muted-foreground">
        {text[status]}
      </p>
      {status === "loadError" && (
        <Button
          variant="outline"
          className="mt-2 rounded-full"
          onClick={() => setRetry((v) => v + 1)}
        >
          {text.retry}
        </Button>
      )}
    </div>
  );
}
