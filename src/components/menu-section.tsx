import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n";

export function MenuSection({ businessId, isOwner }: { businessId: string; isOwner: boolean }) {
  const t = useT();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");

  const { data: items } = useQuery({
    queryKey: ["menu", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id,name,description,category,price,currency,sort_order")
        .eq("business_id", businessId)
        .order("category", { ascending: true, nullsFirst: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) return toast.error(t("menu.price"));
    const { error } = await supabase.from("menu_items").insert({
      business_id: businessId,
      name: name.trim().slice(0, 120),
      description: description.trim().slice(0, 500) || null,
      category: category.trim().slice(0, 60) || null,
      price: priceNum,
      currency: currency.trim().slice(0, 8).toUpperCase() || "USD",
    });
    if (error) return toast.error(error.message);
    setName(""); setPrice(""); setCategory(""); setDescription("");
    toast.success(t("menu.added"));
    qc.invalidateQueries({ queryKey: ["menu", businessId] });
  }

  async function removeItem(id: string) {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("menu.removed"));
    qc.invalidateQueries({ queryKey: ["menu", businessId] });
  }

  const grouped = new Map<string, typeof items>();
  (items ?? []).forEach((it) => {
    const key = it.category || "";
    if (!grouped.has(key)) grouped.set(key, [] as typeof items);
    grouped.get(key)!.push(it);
  });

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl">{t("menu.title")}</h2>
      </div>

      <div className="mt-4 grid gap-4">
        {(!items || items.length === 0) && (
          <p className="text-sm text-muted-foreground">{t("menu.empty")}</p>
        )}
        {Array.from(grouped.entries()).map(([cat, list]) => (
          <div key={cat} className="rounded-2xl border border-border bg-card p-4">
            {cat && <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{cat}</div>}
            <ul className="divide-y divide-border">
              {(list ?? []).map((it) => (
                <li key={it.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="font-display text-lg">{it.name}</div>
                    {it.description && (
                      <div className="text-sm text-muted-foreground">{it.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="font-display text-lg tabular-nums">
                      {Number(it.price).toFixed(2)} <span className="text-xs text-muted-foreground">{it.currency}</span>
                    </div>
                    {isOwner && (
                      <Button size="icon" variant="ghost" onClick={() => removeItem(it.id)} aria-label={t("menu.remove")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {isOwner && (
        <form
          onSubmit={addItem}
          className="mt-4 grid gap-2 rounded-2xl border border-dashed border-border bg-muted/40 p-4 sm:grid-cols-2"
        >
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">{t("menu.name")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("menu.namePh")} maxLength={120} />
          </div>
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">{t("menu.price")}</label>
              <Input type="number" step="0.01" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">{t("menu.currency")}</label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={8} />
            </div>
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">{t("menu.category")}</label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("menu.categoryPh")} maxLength={60} />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <label className="text-xs text-muted-foreground">{t("menu.description")}</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("menu.descriptionPh")} maxLength={500} rows={2} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="rounded-full">
              <Plus className="me-1 h-4 w-4" /> {t("menu.add")}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
