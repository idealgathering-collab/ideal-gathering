import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { formatDateTime } from "@/lib/gatherings";
import { useI18n, useT } from "@/i18n";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatIndex,
  head: () => ({
    meta: [
      { title: "Chat — Ideal Gathering" },
      { name: "description", content: "Your gathering chat rooms." },
    ],
  }),
});

type Row = {
  id: string;
  subject: string;
  starts_at: string;
  status: string;
  business: { name: string } | null;
};

function ChatIndex() {
  const { user } = useSession();
  const t = useT();
  const { lang } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ["chat-rooms", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [hosted, attended] = await Promise.all([
        supabase
          .from("gatherings")
          .select("id, subject, starts_at, status, business:businesses(name)")
          .eq("host_id", user!.id),
        supabase
          .from("gathering_attendees")
          .select("gathering:gatherings(id, subject, starts_at, status, business:businesses(name))")
          .eq("user_id", user!.id),
      ]);
      if (hosted.error) throw hosted.error;
      if (attended.error) throw attended.error;
      const map = new Map<string, Row>();
      for (const r of (hosted.data ?? []) as Row[]) map.set(r.id, r);
      for (const r of attended.data ?? []) {
        const g = r.gathering as Row | null;
        if (g) map.set(g.id, g);
      }
      return Array.from(map.values())
        .filter((g) => g.status !== "rejected" && g.status !== "cancelled")
        .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{t("chat.eyebrow")}</p>
        <h1 className="font-display text-4xl sm:text-5xl">{t("chat.title")}</h1>

        <div className="mt-8 grid gap-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("chat.loading")}</p>
          ) : data && data.length > 0 ? (
            data.map((g) => (
              <Link
                key={g.id}
                to="/gatherings/$id"
                params={{ id: g.id }}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="font-display text-lg truncate">{g.subject}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {formatDateTime(g.starts_at, lang)}
                    {g.business?.name ? ` · ${g.business.name}` : ""}
                  </div>
                </div>
                <MessageCircle className="ms-3 h-5 w-5 text-primary" />
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t("chat.empty")}</p>
          )}
        </div>
      </main>
    </div>
  );
}
