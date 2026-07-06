import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/register-business")({
  component: RegisterBusiness,
});

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  cover_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  tableCount: z.coerce.number().int().min(1).max(30),
  defaultCapacity: z.coerce.number().int().min(1).max(20),
});

function RegisterBusiness() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    cover_url: "",
    tableCount: 4,
    defaultCapacity: 4,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      const v = schema.parse(form);
      setLoading(true);
      const { data: biz, error } = await supabase
        .from("businesses")
        .insert({
          owner_id: user.id,
          name: v.name,
          description: v.description || null,
          address: v.address || null,
          city: v.city || null,
          cover_url: v.cover_url || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      const rows = Array.from({ length: v.tableCount }, (_, i) => ({
        business_id: biz.id,
        label: String(i + 1),
        capacity: v.defaultCapacity,
      }));
      const { error: tErr } = await supabase.from("venue_tables").insert(rows);
      if (tErr) throw tErr;

      toast.success("Business registered");
      navigate({ to: "/businesses/$id", params: { id: biz.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-warm">
            <Store className="h-5 w-5 text-tangerine-foreground" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">For cafes & restaurants</p>
            <h1 className="font-display text-3xl">Register your business</h1>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="grid gap-2">
            <Label htmlFor="name">Venue name</Label>
            <Input id="name" required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" maxLength={600} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" maxLength={80} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" maxLength={200} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cover_url">Cover image URL (optional)</Label>
            <Input id="cover_url" type="url" maxLength={500} value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tableCount">Number of tables</Label>
              <Input id="tableCount" type="number" min={1} max={30} value={form.tableCount} onChange={(e) => setForm({ ...form, tableCount: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Seats per table</Label>
              <Input id="capacity" type="number" min={1} max={20} value={form.defaultCapacity} onChange={(e) => setForm({ ...form, defaultCapacity: Number(e.target.value) })} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tables are auto-labeled 1, 2, 3… You can rename or add more later.
          </p>
          <Button type="submit" disabled={loading} size="lg" className="mt-2 h-12 rounded-full">
            {loading ? "Registering…" : "Register business"}
          </Button>
        </form>
      </main>
    </div>
  );
}
