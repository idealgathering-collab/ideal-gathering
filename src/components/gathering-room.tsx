import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Plus, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n";

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
  const { data } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
  const map: Record<string, Profile> = {};
  for (const p of (data ?? []) as Profile[]) map[p.id] = p;
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
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("gathering_messages")
        .select("id, gathering_id, sender_id, body, created_at")
        .eq("gathering_id", gatheringId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) return toast.error(error.message);
      if (!alive) return;
      const msgs = (data as Msg[]) ?? [];
      setMessages(msgs);
      setProfiles(await loadProfiles(Array.from(new Set(msgs.map((m) => m.sender_id)))));
    })();
    return () => {
      alive = false;
    };
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
  }, [gatheringId]);

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
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {!mine && <div className="mb-0.5 text-xs font-medium opacity-70">{name}</div>}
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div className={`mt-0.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
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
                  className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted"
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
