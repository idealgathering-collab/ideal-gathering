import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Flag, MoreVertical, Plus, Send, ShieldOff, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReportDialog, type ReportTarget } from "@/components/report-dialog";
import { blockUser, listGatheringMessages } from "@/lib/moderation.functions";
import { useI18n, useT } from "@/i18n";

type Msg = {
  id: string;
  gathering_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ChecklistItem = {
  id: string;
  gathering_id: string;
  label: string;
  sort_order: number;
};

type Check = { item_id: string; user_id: string };

type Profile = { id: string; display_name: string | null; avatar_url: string | null };

async function loadProfiles(ids: string[]): Promise<Record<string, Profile>> {
  if (ids.length === 0) return {};
  const { getPublicProfiles } = await import("@/lib/public-data.functions");
  const data = await getPublicProfiles({ data: { ids } });
  const map: Record<string, Profile> = {};
  for (const p of data) map[p.id] = p;
  return map;
}

export function GatheringChat({
  gatheringId,
  currentUserId,
}: {
  gatheringId: string;
  currentUserId: string;
}) {
  const t = useT();
  const { lang } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // The realtime handler must read the *current* block list, not the empty set
  // captured when the channel was first subscribed.
  const hiddenRef = useRef<Set<string>>(new Set());

  async function loadMessages(): Promise<Msg[] | null> {
    try {
      const res = await listGatheringMessages({ data: { gatheringId } });
      hiddenRef.current = new Set(res.hiddenUserIds);
      setHidden(new Set(res.hiddenUserIds));
      setMessages(res.messages);
      return res.messages;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
      return null;
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const msgs = await loadMessages();
      if (!alive || !msgs) return;
      setProfiles(await loadProfiles(Array.from(new Set(msgs.map((m) => m.sender_id)))));
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatheringId]);

  useEffect(() => {
    const channel = supabase
      .channel(`gm:${gatheringId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gathering_messages",
          filter: `gathering_id=eq.${gatheringId}`,
        },
        async (payload) => {
          const m = payload.new as Msg;
          if (hiddenRef.current.has(m.sender_id)) return;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (!profiles[m.sender_id]) {
            const more = await loadProfiles([m.sender_id]);
            setProfiles((prev) => ({ ...prev, ...more }));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatheringId, hidden]);

  async function confirmBlock() {
    if (!blockTarget) return;
    try {
      await blockUser({ data: { userId: blockTarget.id } });
      setBlockTarget(null);
      toast.success(t("mod.blockedOk"));
      await loadMessages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    }
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    const text = body.trim();
    if (!text) return;
    try {
      setSending(true);
      const { error } = await supabase
        .from("gathering_messages")
        .insert({ gathering_id: gatheringId, sender_id: currentUserId, body: text });
      if (error) throw error;
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[520px] flex-col rounded-2xl border border-border bg-card">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">{t("room.chat.empty")}</p>
        )}
        {messages.map((m) => {
          const p = profiles[m.sender_id];
          const mine = m.sender_id === currentUserId;
          const name = p?.display_name ?? t("room.chat.someone");
          return (
            <div key={m.id} className={`group flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {!mine && <div className="mb-0.5 text-xs font-medium opacity-70">{name}</div>}
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div className={`mt-0.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString(lang, { hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
              {!mine && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("mod.actions")}
                      className="rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted focus:opacity-100 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onSelect={() => setBlockTarget({ id: m.sender_id, name })}>
                      <ShieldOff className="me-2 h-4 w-4" />
                      {t("mod.block")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        setReportTarget({
                          targetType: "user",
                          targetId: m.sender_id,
                          targetUserId: m.sender_id,
                          gatheringId,
                          label: name,
                        })
                      }
                    >
                      <Flag className="me-2 h-4 w-4" />
                      {t("mod.report")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 border-t border-border p-3"
      >
        <Input
          value={body}
          maxLength={2000}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("room.chat.placeholder")}
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !body.trim()} className="rounded-full">
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <AlertDialog open={!!blockTarget} onOpenChange={(o) => !o && setBlockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mod.block.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("mod.block.confirmBody", { name: blockTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmBlock();
              }}
            >
              {t("mod.block")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReportDialog target={reportTarget} onOpenChange={(o) => !o && setReportTarget(null)} />
    </div>
  );
}

export function GatheringChecklist({
  gatheringId,
  currentUserId,
  isHost,
}: {
  gatheringId: string;
  currentUserId: string;
  isHost: boolean;
}) {
  const t = useT();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [it, ch] = await Promise.all([
      supabase
        .from("gathering_checklist_items")
        .select("id, gathering_id, label, sort_order")
        .eq("gathering_id", gatheringId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase.from("gathering_checklist_checks").select("item_id, user_id").eq("user_id", currentUserId),
    ]);
    if (it.error) toast.error(it.error.message);
    else setItems((it.data as ChecklistItem[]) ?? []);
    if (ch.error) toast.error(ch.error.message);
    else setChecks((ch.data as Check[]) ?? []);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatheringId, currentUserId]);

  const checkedIds = useMemo(() => new Set(checks.map((c) => c.item_id)), [checks]);

  async function addItem() {
    const v = label.trim();
    if (!v) return;
    try {
      setBusy(true);
      const nextOrder = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
      const { error } = await supabase
        .from("gathering_checklist_items")
        .insert({ gathering_id: gatheringId, label: v, sort_order: nextOrder });
      if (error) throw error;
      setLabel("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(id: string) {
    const { error } = await supabase.from("gathering_checklist_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await refresh();
  }

  async function toggle(itemId: string) {
    if (checkedIds.has(itemId)) {
      const { error } = await supabase
        .from("gathering_checklist_checks")
        .delete()
        .eq("item_id", itemId)
        .eq("user_id", currentUserId);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("gathering_checklist_checks")
        .insert({ item_id: itemId, user_id: currentUserId });
      if (error) return toast.error(error.message);
    }
    await refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("room.checklist.empty")}</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((it) => {
            const done = checkedIds.has(it.id);
            return (
              <li key={it.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggle(it.id)}
                  className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-start hover:bg-muted"
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={done ? "text-muted-foreground line-through" : ""}>{it.label}</span>
                </button>
                {isHost && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(it.id)}
                    aria-label={t("room.checklist.delete")}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {isHost && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addItem();
          }}
          className="mt-4 flex gap-2 border-t border-border pt-4"
        >
          <Input
            value={label}
            maxLength={140}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("room.checklist.placeholder")}
            disabled={busy}
          />
          <Button type="submit" size="icon" disabled={busy || !label.trim()} className="rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
