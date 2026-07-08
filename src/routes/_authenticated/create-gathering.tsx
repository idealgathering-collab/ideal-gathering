import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { VerifyEmailBanner } from "@/components/verify-email-banner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/i18n";

export const Route = createFileRoute("/_authenticated/create-gathering")({
  component: CreateGathering,
});

const schema = z.object({
  business_id: z.string().uuid("Pick a venue"),
  table_id: z.string().uuid("Pick a table"),
  subject: z.string().trim().min(3, "Subject too short").max(120),
  description: z.string().trim().max(800).optional().or(z.literal("")),
  starts_at: z.string().min(1, "Pick a date & time"),
  seats: z.coerce.number().int().min(2).max(30),
});

function CreateGathering() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_id: "",
    table_id: "",
    subject: "",
    description: "",
    starts_at: "",
    seats: 4,
  });

  const { data: businesses } = useQuery({
    queryKey: ["all-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,city,owner_id,venue_tables(id,label,capacity)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const selectedBiz = useMemo(
    () => businesses?.find((b) => b.id === form.business_id),
    [businesses, form.business_id],
  );

  useEffect(() => {
    // reset table when business changes
    setForm((f) => ({ ...f, table_id: "" }));
  }, [form.business_id]);

  const isOwner = selectedBiz?.owner_id === user?.id;

  const emailVerified = Boolean(user?.email_confirmed_at);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!emailVerified) {
      toast.error("Please verify your email first");
      return;
    }
    try {
      const v = schema.parse(form);
      const iso = new Date(v.starts_at).toISOString();
      if (new Date(iso) < new Date()) {
        toast.error("Pick a future date & time");
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("gatherings")
        .insert({
          business_id: v.business_id,
          table_id: v.table_id,
          host_id: user.id,
          subject: v.subject,
          description: v.description || null,
          starts_at: iso,
          seats: v.seats,
          status: "proposed",
        })
        .select("id")
        .single();
      if (error) throw error;

      // If the host owns the venue, auto-approve.
      if (isOwner) {
        await supabase.from("gatherings").update({ status: "approved" }).eq("id", data.id);
        toast.success("Gathering published");
      } else {
        toast.success("Gathering proposed — awaiting venue approval");
      }
      navigate({ to: "/gatherings/$id", params: { id: data.id } });
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
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-hero">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Host</p>
            <h1 className="font-display text-3xl">Propose a gathering</h1>
          </div>
        </div>

        {!emailVerified && (
          <div className="mb-6">
            <VerifyEmailBanner email={user?.email} />
          </div>
        )}

        <form onSubmit={submit} className="grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="grid gap-2">
            <Label>Venue</Label>
            <Select value={form.business_id} onValueChange={(v) => setForm({ ...form, business_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a cafe or restaurant" />
              </SelectTrigger>
              <SelectContent>
                {(businesses ?? []).map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                    {b.city ? ` · ${b.city}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {businesses && businesses.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No venues registered yet — ask one to sign up, or register your own.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Table</Label>
            <Select value={form.table_id} onValueChange={(v) => setForm({ ...form, table_id: v })} disabled={!selectedBiz}>
              <SelectTrigger>
                <SelectValue placeholder={selectedBiz ? "Pick a table" : "Pick venue first"} />
              </SelectTrigger>
              <SelectContent>
                {(selectedBiz?.venue_tables ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    Table {t.label} · seats {t.capacity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              required
              maxLength={120}
              value={form.subject}
              placeholder="e.g. Books that changed my mind"
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              maxLength={800}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's this gathering about? Who should come?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="starts_at">Date & time</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                required
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seats">Seats</Label>
              <Input
                id="seats"
                type="number"
                min={2}
                max={30}
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
              />
            </div>
          </div>

          {selectedBiz && !isOwner && (
            <p className="rounded-2xl bg-sunshine/40 px-4 py-3 text-xs text-foreground/80">
              The venue owner will review and approve your gathering before it appears publicly.
            </p>
          )}

          <Button type="submit" size="lg" disabled={loading || !emailVerified} className="mt-2 h-12 rounded-full">
            {loading ? "Sending…" : !emailVerified ? "Verify email to continue" : isOwner ? "Publish gathering" : "Propose gathering"}
          </Button>
        </form>
      </main>
    </div>
  );
}
