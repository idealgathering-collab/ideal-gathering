import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { pushStore } from "@/lib/push-store";
import {
  disablePush,
  enablePush,
  inspectPush,
  publicPushKey,
  pushCapability,
} from "@/lib/web-push";

const copy = {
  en: {
    title: "Notifications on this device",
    body: "Prepare this device for Havato notifications. Notifications are not being sent yet.",
    enable: "Enable notifications",
    disable: "Disable on this device",
    checking: "Checking this device…",
    ready: "Not enabled on this device.",
    enabled: "This device is registered. Notifications will begin in a later release.",
    repair: "This device needs to be registered again. Tap Enable to retry.",
    busy: "Updating…",
    denied: "Notifications are blocked. Allow them in your browser or device settings, then retry.",
    dismissed: "Permission was not granted. You can choose Enable again when ready.",
    unsupported: "This browser does not support Web Push.",
    insecure: "Notifications require a secure connection.",
    "ios-install":
      "On iPhone or iPad, add Havato to your Home Screen and open it there to enable notifications.",
    configuration: "Notifications are not ready yet. Please check back later.",
    error: "Could not update this device. Check your connection and retry.",
    worker: "Waiting for the app to finish preparing. Reload to retry.",
  },
  fa: {
    title: "اعلان‌ها در این دستگاه",
    body: "این دستگاه را برای اعلان‌های هواتو آماده کنید. هنوز اعلانی ارسال نمی‌شود.",
    enable: "فعال‌کردن اعلان‌ها",
    disable: "غیرفعال‌کردن در این دستگاه",
    checking: "در حال بررسی دستگاه…",
    ready: "اعلان‌ها در این دستگاه فعال نیستند.",
    enabled: "این دستگاه ثبت شد. ارسال اعلان‌ها در نسخه‌های بعدی شروع می‌شود.",
    repair: "این دستگاه باید دوباره ثبت شود. برای تلاش مجدد، فعال‌کردن را بزنید.",
    busy: "در حال به‌روزرسانی…",
    denied:
      "اعلان‌ها مسدود هستند. آن‌ها را در تنظیمات مرورگر یا دستگاه مجاز کنید و دوباره تلاش کنید.",
    dismissed: "اجازه داده نشد. هر وقت آماده بودید دوباره فعال‌کردن را بزنید.",
    unsupported: "این مرورگر از اعلان وب پشتیبانی نمی‌کند.",
    insecure: "اعلان‌ها به اتصال امن نیاز دارند.",
    "ios-install":
      "در آیفون یا آیپد، هواتو را به صفحهٔ اصلی اضافه کنید و از همان‌جا باز کنید تا اعلان‌ها فعال شوند.",
    configuration: "اعلان‌ها هنوز آماده نیستند. لطفاً بعداً دوباره بررسی کنید.",
    error: "به‌روزرسانی دستگاه انجام نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.",
    worker: "در حال آماده‌سازی برنامه. برای تلاش مجدد صفحه را بارگذاری کنید.",
  },
};
type Status = keyof typeof copy.en;

export function PushNotificationEntry() {
  const { user } = useSession();
  const userId = user?.id;
  const { lang } = useI18n();
  const text = copy[lang === "fa" ? "fa" : "en"];
  const [status, setStatus] = useState<Status>("checking");
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  const key = import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY as string | undefined;

  useEffect(() => {
    let active = true;
    setRegistration(undefined);
    setSubscribed(false);
    if (!userId) return;
    const capability = pushCapability(window, navigator);
    if (capability !== "supported") {
      setStatus(capability);
      return;
    }
    setStatus("checking");
    // Registration is prepared before the tap; never wait for it before permission.
    void navigator.serviceWorker.ready
      .then(async (ready) => {
        if (!active) return;
        setRegistration(ready);
        try {
          const result = await inspectPush(ready, pushStore(userId));
          if (!active) return;
          setSubscribed(!!result.subscription);
          setStatus(
            Notification.permission === "denied"
              ? "denied"
              : result.saved
                ? "enabled"
                : !publicPushKey(key)
                  ? "configuration"
                  : result.subscription
                    ? "repair"
                    : "ready",
          );
        } catch {
          if (active) setStatus("error");
        }
      })
      .catch(() => {
        if (active) setStatus("worker");
      });
    const timeout = window.setTimeout(() => {
      if (active) setStatus((s) => (s === "checking" ? "worker" : s));
    }, 10000);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [userId, key]);

  async function update(disable: boolean) {
    if (!user || !registration || busy) return;
    const userId = user.id;
    setBusy(true);
    try {
      const store = pushStore(userId);
      if (disable) {
        await disablePush(registration, store);
        if (currentUser.current !== userId) return;
        setSubscribed(false);
        setStatus(publicPushKey(key) ? "ready" : "configuration");
      } else {
        const subscription = await enablePush({
          registration,
          store,
          publicKey: key ?? "",
          notification: Notification,
          stillAuthenticated: async () => {
            const { data } = await supabase.auth.getSession();
            return currentUser.current === userId && data.session?.user.id === userId;
          },
        });
        if (currentUser.current !== userId) return;
        setSubscribed(!!subscription);
        setStatus(
          subscription ? "enabled" : Notification.permission === "denied" ? "denied" : "dismissed",
        );
      }
    } catch {
      if (currentUser.current === userId) setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;
  const supported = registration && pushCapability(window, navigator) === "supported";
  return (
    <section
      className="mt-6 w-full rounded-3xl border border-border/60 bg-card p-4 text-start sm:p-6"
      aria-label={text.title}
    >
      <h2 className="flex items-center gap-2 font-display text-lg">
        <Bell className="h-4 w-4" />
        {text.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{text.body}</p>
      <p role="status" className="mt-2 text-sm text-muted-foreground">
        {busy ? text.busy : text[status]}
      </p>
      {supported && (
        <div className="mt-4 flex flex-wrap gap-2">
          {status !== "enabled" && (
            <Button
              className="rounded-full"
              disabled={busy || !publicPushKey(key) || Notification.permission === "denied"}
              onClick={() => void update(false)}
            >
              {text.enable}
            </Button>
          )}
          {subscribed && (
            <Button
              variant="outline"
              className="rounded-full"
              disabled={busy}
              onClick={() => void update(true)}
            >
              {text.disable}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
