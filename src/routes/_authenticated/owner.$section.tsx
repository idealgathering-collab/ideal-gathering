import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  Copy,
  Mail,
  Send,
  Ticket,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchRoles } from "@/lib/roles";
import { getOwnerDirectory, type OwnerDirectorySection } from "@/lib/owner.functions";
import { createInvitation, revokeInvitation } from "@/lib/beta-admin";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/ideal-gathering-logo.png.asset.json";

const ALLOWED = new Set<OwnerDirectorySection>(["waitlist", "users", "venues", "invitations", "gatherings"]);

export const Route = createFileRoute("/_authenticated/owner/$section")({
  beforeLoad: async ({ context, params }) => {
    const roles = await fetchRoles(context.user.id);
    if (!roles.has("owner")) throw redirect({ to: "/admin", replace: true });
    if (!ALLOWED.has(params.section as OwnerDirectorySection)) throw redirect({ to: "/owner", replace: true });
  },
  head: ({ params }) => ({
    meta: [
      { title: `${labelFor(params.section as OwnerDirectorySection)} — Owner — Ideal Gathering` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerDirectoryPage,
});

function OwnerDirectoryPage() {
  const { section } = Route.useParams();
  const typedSection = section as OwnerDirectorySection;
  const qc = useQueryClient();
  const rows = useQuery({
    queryKey: ["owner-directory", typedSection],
    queryFn: () => getOwnerDirectory({ data: { section: typedSection } }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["owner-directory", typedSection] });

  return (
    <div className="min-h-screen bg-background">
      <OwnerSubHeader title={labelFor(typedSection)} />
      <main className="mx-auto max-w-6xl px-4 py-8 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Owner control</p>
            <h1 className="mt-1 font-display text-4xl">{labelFor(typedSection)}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{descriptionFor(typedSection)}</p>
          </div>
          <Badge variant="outline" className="rounded-full">{rows.data?.length ?? 0} records</Badge>
        </div>

        {rows.isLoading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.isError ? (
          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
            {rows.error instanceof Error ? rows.error.message : "Could not load this section."}
          </div>
        ) : (
          <div className="mt-8">
            {typedSection === "waitlist" && <WaitlistRows rows={rows.data ?? []} onChanged={refresh} />}
            {typedSection === "users" && <UserRows rows={rows.data ?? []} />}
            {typedSection === "venues" && <VenueRows rows={rows.data ?? []} onChanged={refresh} />}
            {typedSection === "invitations" && <InvitationRows rows={rows.data ?? []} onChanged={refresh} />}
            {typedSection === "gatherings" && <GatheringRows rows={rows.data ?? []} onChanged={refresh} />}
          </div>
        )}
      </main>
    </div>
  );
}

function WaitlistRows({ rows, onChanged }: { rows: any[]; onChanged: () => void }) {
  const invite = useMutation({
    mutationFn: (row: any) => createInvitation({ email: row.email, note: `waitlist: ${row.name}` }),
    onSuccess: (created) => {
      void navigator.clipboard?.writeText(created.code).catch(() => {});
      toast.success(`Invitation created: ${created.code}`);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (rows.length === 0) return <Empty text="Nobody is waiting right now." />;
  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Users className="h-5 w-5 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{row.name}</p>
            <p className="truncate text-sm text-muted-foreground">{row.email}{row.city ? ` · ${row.city}` : ""}</p>
            {row.interests && <p className="mt-1 text-xs text-muted-foreground">{row.interests}</p>}
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
          <Button size="sm" className="rounded-full" disabled={invite.isPending} onClick={() => invite.mutate(row)}>
            <Send className="me-1.5 h-4 w-4" /> Invite
          </Button>
        </div>
      ))}
    </div>
  );
}

function UserRows({ rows }: { rows: any[] }) {
  if (rows.length === 0) return <Empty text="No member accounts yet." />;
  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          {row.avatar_url ? (
            <img src={row.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-muted"><UserRound className="h-5 w-5" /></div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium">{row.display_name || row.email || "Unnamed member"}</p>
            <p className="truncate text-sm text-muted-foreground">{row.email || "No email"}{row.city ? ` · ${row.city}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {(row.roles ?? []).map((role: string) => <Badge key={role} variant="secondary" className="rounded-full">{role}</Badge>)}
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to="/people/$id" params={{ id: row.id }}>View profile</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

function VenueRows({ rows, onChanged }: { rows: any[]; onChanged: () => void }) {
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("businesses").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, vars) => {
      toast.success(vars.status === "approved" ? "Venue approved." : "Venue rejected.");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (rows.length === 0) return <Empty text="No registered venues yet." />;
  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Building2 className="h-5 w-5 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{row.name}</p>
            <p className="truncate text-sm text-muted-foreground">{[row.city, row.address].filter(Boolean).join(" · ") || "No location"}</p>
          </div>
          <Badge variant={row.status === "approved" ? "default" : "secondary"} className="rounded-full">{row.status}</Badge>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to="/owner/venue-preview" search={{ venue: row.id } as never}>View as Venue</Link>
          </Button>
          {row.status !== "approved" && (
            <Button size="sm" className="rounded-full" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: row.id, status: "approved" })}>
              <Check className="me-1 h-4 w-4" /> Approve
            </Button>
          )}
          {row.status !== "rejected" && (
            <Button size="sm" variant="outline" className="rounded-full" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: row.id, status: "rejected" })}>
              <X className="me-1 h-4 w-4" /> Reject
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function InvitationRows({ rows, onChanged }: { rows: any[]; onChanged: () => void }) {
  const revoke = useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => {
      toast.success("Invitation revoked.");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (rows.length === 0) return <Empty text="No invitations yet." />;
  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Ticket className="h-5 w-5 text-primary" />
          <code className="text-sm">{row.code}</code>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{row.email || "Open invitation"}</p>
            {row.note && <p className="truncate text-xs text-muted-foreground">{row.note}</p>}
          </div>
          <Badge variant="secondary" className="rounded-full">{row.status}</Badge>
          <Button size="icon" variant="ghost" className="rounded-full" onClick={() => { void navigator.clipboard?.writeText(row.code); toast.success("Code copied."); }}>
            <Copy className="h-4 w-4" />
          </Button>
          {row.status === "pending" && (
            <Button size="sm" variant="outline" className="rounded-full text-destructive" disabled={revoke.isPending} onClick={() => revoke.mutate(row.id)}>
              Revoke
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function GatheringRows({ rows, onChanged }: { rows: any[]; onChanged: () => void }) {
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("gatherings").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Gathering updated.");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (rows.length === 0) return <Empty text="No gatherings yet." />;
  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <CalendarDays className="h-5 w-5 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{row.subject}</p>
            <p className="truncate text-sm text-muted-foreground">{[row.venue_name, row.city].filter(Boolean).join(" · ") || "No venue"} · {formatDate(row.starts_at)}</p>
          </div>
          <Badge variant="secondary" className="rounded-full">{row.status}</Badge>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to="/gatherings/$id" params={{ id: row.id }}>Open</Link>
          </Button>
          {row.status === "proposed" && (
            <Button size="sm" className="rounded-full" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: row.id, status: "approved" })}>
              <Check className="me-1 h-4 w-4" /> Approve
            </Button>
          )}
          {row.status !== "cancelled" && (
            <Button size="sm" variant="outline" className="rounded-full" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: row.id, status: "cancelled" })}>
              Cancel
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function OwnerSubHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/owner" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="" className="h-9 w-9 rounded-full object-contain" />
          <span className="font-display text-lg">Ideal <span className="italic text-primary">Gathering</span></span>
          <Badge variant="outline" className="ms-1 rounded-full">Owner · {title}</Badge>
        </Link>
        <Button asChild variant="ghost" className="rounded-full"><Link to="/owner"><ArrowLeft className="me-2 h-4 w-4" />Back to Owner</Link></Button>
      </div>
    </header>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">{text}</div>;
}

function labelFor(section: OwnerDirectorySection) {
  return ({ waitlist: "Waiting List", users: "Users", venues: "Venues", invitations: "Invitations", gatherings: "Gatherings" } as const)[section];
}

function descriptionFor(section: OwnerDirectorySection) {
  return ({
    waitlist: "See every person waiting for beta access and invite them directly.",
    users: "Inspect registered member accounts and open their profiles.",
    venues: "Review all registered venues, approve or reject them, and enter venue preview.",
    invitations: "Inspect invitation status, copy codes, and revoke pending invitations.",
    gatherings: "Inspect and control gatherings across the platform.",
  } as const)[section];
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
