import { Bell } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSession } from "@/hooks/use-session";
import { useT, useI18n } from "@/i18n";
import {
  fetchMyNotifications,
  markAllRead,
  relativeTime,
  type NotificationRow,
} from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";

export function NotificationsBell({ className }: { className?: string }) {
  const { user } = useSession();
  const t = useT();
  const { lang } = useI18n();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const rows = await fetchMyNotifications(user.id);
      setItems(rows);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, load]);

  async function onOpenChange(v: boolean) {
    setOpen(v);
    if (v && items.some((i) => !i.read) && user) {
      try {
        await markAllRead(user.id);
        setItems((prev) => prev.map((i) => ({ ...i, read: true })));
      } catch {
        // ignore
      }
    }
  }

  if (!user) return null;
  const unread = items.filter((i) => !i.read).length;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("notif.aria")} className={`relative rounded-full ${className ?? ""}`}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -end-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <div className="font-display text-sm">{t("notif.title")}</div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">{t("notif.empty")}</div>
          ) : (
            <ul>
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`border-b border-border/60 px-4 py-3 last:border-b-0 ${
                    n.read ? "" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{n.title}</div>
                      {n.body && <div className="mt-0.5 text-xs text-muted-foreground whitespace-pre-wrap">{n.body}</div>}
                      <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {relativeTime(n.created_at, lang)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
