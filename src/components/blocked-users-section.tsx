import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { listMyBlocks, unblockUser, type BlockedPerson } from "@/lib/moderation.functions";

export function BlockedUsersSection({ className }: { className?: string } = {}) {
  const t = useT();
  const [rows, setRows] = useState<BlockedPerson[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await listMyBlocks());
    } catch {
      setRows([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function unblock(userId: string) {
    try {
      setBusy(userId);
      await unblockUser({ data: { userId } });
      toast.success(t("mod.unblocked"));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.generic"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-8 rounded-3xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-display text-xl">
        <ShieldOff className="h-5 w-5 text-muted-foreground" />
        {t("mod.blocked.title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("mod.blocked.body")}</p>

      {rows === null ? (
        <p className="mt-4 text-sm text-muted-foreground">…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          {t("mod.blocked.empty")}
        </p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {rows.map((r) => (
            <li key={r.user_id} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
              <span className="min-w-0 truncate text-sm">
                {r.display_name ?? r.user_id.slice(0, 8)}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={busy === r.user_id}
                onClick={() => unblock(r.user_id)}
              >
                {t("mod.unblock")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
