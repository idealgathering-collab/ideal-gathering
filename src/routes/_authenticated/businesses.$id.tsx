import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Store, MapPin, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/gatherings";
import { useT } from "@/i18n";

export const Route = createFileRoute("/_authenticated/businesses/$id")({
  component: BusinessDetail,
});

function BusinessDetail() {
  const { id } = Route.useParams();
  const t = useT();

  const { data: biz } = useQuery({
    queryKey: ["business-public", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id,name,description,city,address,cover_url,menu_link,venue_tables(id,label,capacity),gatherings(id,subject,status,starts_at,seats,table:venue_tables(label)),menu_items(id,name,description,category,price,currency)"
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!biz) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  const approved = (biz.gatherings ?? []).filter((g) => g.status === "approved");

  const menuByCat = new Map<string, typeof biz.menu_items>();
  (biz.menu_items ?? []).forEach((it) => {
    const k = it.category || "";
    if (!menuByCat.has(k)) menuByCat.set(k, [] as typeof biz.menu_items);
    menuByCat.get(k)!.push(it);
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-wrap items-start gap-4">
          {biz.cover_url ? (
            <img src={biz.cover_url} alt="" className="h-24 w-24 rounded-3xl object-cover" />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-warm">
              <Store className="h-8 w-8 text-tangerine-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{biz.city ?? t("biz.venue")}</p>
            <h1 className="font-display text-3xl sm:text-4xl">{biz.name}</h1>
            {biz.address && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {biz.address}
              </p>
            )}
          </div>
        </div>

        {biz.description && <p className="mt-6 max-w-2xl text-muted-foreground">{biz.description}</p>}

        {biz.menu_link && (
          <a
            href={biz.menu_link}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" /> {t("biz.viewFullMenu")}
          </a>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl">{t("biz.approved")}</h2>
          <div className="mt-4 grid gap-2">
            {approved.length === 0 && <p className="text-sm text-muted-foreground">{t("biz.noneYet")}</p>}
            {approved.map((g) => (
              <Link
                key={g.id}
                to="/gatherings/$id"
                params={{ id: g.id }}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="font-display text-lg truncate">{g.subject}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(g.starts_at)} · {t("biz.tableLabel")} {g.table?.label}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {biz.menu_items && biz.menu_items.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl">{t("menu.title")}</h2>
            <div className="mt-4 grid gap-4">
              {Array.from(menuByCat.entries()).map(([cat, list]) => (
                <div key={cat} className="rounded-2xl border border-border bg-card p-4">
                  {cat && <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{cat}</div>}
                  <ul className="divide-y divide-border">
                    {(list ?? []).map((it) => (
                      <li key={it.id} className="flex items-start justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <div className="font-display text-lg">{it.name}</div>
                          {it.description && <div className="text-sm text-muted-foreground">{it.description}</div>}
                        </div>
                        <div className="font-display text-lg tabular-nums">
                          {Number(it.price).toFixed(2)}{" "}
                          <span className="text-xs text-muted-foreground">{it.currency}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
