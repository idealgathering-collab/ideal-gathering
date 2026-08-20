import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listReports, setReportStatus, type AdminReportRow } from "@/lib/moderation.functions";
import { useI18n, useT } from "@/i18n";
import { formatDateTime } from "@/lib/gatherings";
import { listAdminUsers, getAdminUser, updateAdminUser, listPendingGatherings, setGatheringStatus, type AdminUserRow, type AdminUserDetail, type PendingGatheringRow } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { COUNTRIES, citiesFor, countryName } from "@/lib/locations";
import { insertNotification } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Ideal Gathering" }] }),
  component: AdminPage,
});

type VenueRow = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  cover_url: string | null;
  status: "pending" | "approved" | "rejected";
  owner_id: string;
  created_at: string;
};

type VenueGathering = {
  id: string;
  subject: string;
  starts_at: string;
  seats: number;
  status: string;
  host_id: string;
  gathering_attendees?: Array<{ user_id: string; checked_in_at: string | null }>;
};

type VenueTable = { id: string; label: string; capacity: number };

function AdminPage() {
  const t = useT();
  const { user, loading } = useSession();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setAllowed(!!data));
  }, [user, loading]);

  if (loading || allowed === null) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-12 text-sm text-muted-foreground">
          {t("common.loading")}
        </main>
      </div>
    );
  }
  if (!allowed) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="font-display text-3xl">{t("admin.forbidden.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.forbidden.body")}</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">{t("common.home")}</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-4xl">{t("admin.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.subtitle")}</p>

        <Tabs defaultValue="venues" className="mt-8">
          <TabsList>
            <TabsTrigger value="venues">{t("admin.section.venues")}</TabsTrigger>
            <TabsTrigger value="gatherings">{t("admin.section.gatherings")}</TabsTrigger>
            <TabsTrigger value="locations">{t("admin.section.savedLocations")}</TabsTrigger>
            <TabsTrigger value="users">{t("admin.section.users")}</TabsTrigger>
            <TabsTrigger value="reports">{t("admin.section.reports")}</TabsTrigger>
          </TabsList>
          <TabsContent value="venues" className="mt-6">
            <VenuesSection />
          </TabsContent>
          <TabsContent value="gatherings" className="mt-6">
            <GatheringsSection />
          </TabsContent>
          <TabsContent value="locations" className="mt-6">
            <SavedLocationsAdminSection />
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <UsersSection />
          </TabsContent>
          <TabsContent value="reports" className="mt-6">
            <ReportsSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ------------------------------ Venues ------------------------------

function VenuesSection() {
  const t = useT();
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [selected, setSelected] = useState<VenueRow | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    import("@/lib/business.functions")
      .then(({ listAdminBusinesses }) => listAdminBusinesses())
      .then((data) => setVenues((data as VenueRow[]) ?? []))
      .catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
  }, [tick]);


  const [rejectTarget, setRejectTarget] = useState<VenueRow | null>(null);

  async function approveVenue(v: VenueRow) {
    const { error } = await supabase.from("businesses").update({ status: "approved" }).eq("id", v.id);
    if (error) return toast.error(error.message);
    try {
      await insertNotification({
        recipient_id: v.owner_id,
        type: "business_approved",
        title: `${v.name}: approved`,
        body: "Your venue is live. You can now activate tables and host Gatherings.",
        related_id: v.id,
      });
    } catch (e) {
      // notification failure shouldn't block status change
      console.warn("notify failed", e);
    }
    toast.success(t("admin.venue.set.approved"));
    setTick((n) => n + 1);
    if (selected?.id === v.id) setSelected({ ...selected, status: "approved" });
  }

  async function rejectVenue(v: VenueRow, reason: string) {
    const { error } = await supabase.from("businesses").update({ status: "rejected" }).eq("id", v.id);
    if (error) throw new Error(error.message);
    await insertNotification({
      recipient_id: v.owner_id,
      type: "business_rejected",
      title: `${v.name}: not approved`,
      body: reason,
      related_id: v.id,
    });
    toast.success(t("admin.venue.set.rejected"));
    setTick((n) => n + 1);
    if (selected?.id === v.id) setSelected({ ...selected, status: "rejected" });
  }

  if (selected) {
    return (
      <>
        <VenueDetail
          venue={selected}
          onBack={() => setSelected(null)}
          onApprove={() => approveVenue(selected)}
          onReject={() => setRejectTarget(selected)}
        />
        <RejectReasonDialog
          open={!!rejectTarget}
          title={rejectTarget ? `Reject ${rejectTarget.name}` : ""}
          onClose={() => setRejectTarget(null)}
          onConfirm={async (reason) => {
            if (rejectTarget) await rejectVenue(rejectTarget, reason);
            setRejectTarget(null);
          }}
        />
      </>
    );
  }

  const pending = venues.filter((v) => v.status === "pending");
  const approved = venues.filter((v) => v.status === "approved");

  return (
    <>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            {t("admin.venues.pending")} ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            {t("admin.venues.approved")} ({approved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <Empty text={t("admin.venues.empty.pending")} />
          ) : (
            <div className="grid gap-3">
              {pending.map((v) => (
                <VenueCard
                  key={v.id}
                  v={v}
                  onOpen={() => setSelected(v)}
                  actions={
                    <>
                      <Button size="sm" className="rounded-full" onClick={() => approveVenue(v)}>
                        {t("admin.approve")}
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => setRejectTarget(v)}>
                        {t("admin.reject")}
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approved.length === 0 ? (
            <Empty text={t("admin.venues.empty.approved")} />
          ) : (
            <div className="grid gap-3">
              {approved.map((v) => (
                <VenueCard key={v.id} v={v} onOpen={() => setSelected(v)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <RejectReasonDialog
        open={!!rejectTarget}
        title={rejectTarget ? `Reject ${rejectTarget.name}` : ""}
        onClose={() => setRejectTarget(null)}
        onConfirm={async (reason) => {
          if (rejectTarget) await rejectVenue(rejectTarget, reason);
          setRejectTarget(null);
        }}
      />
    </>
  );
}

function VenueCard({ v, onOpen, actions }: { v: VenueRow; onOpen: () => void; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <button className="min-w-0 flex-1 text-start" onClick={onOpen}>
        <div className="font-display text-lg">{v.name}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {v.city ?? "—"} · {v.address ?? "—"}
        </div>
      </button>
      <div className="flex gap-2">{actions}</div>
    </div>
  );
}

function VenueDetail({
  venue,
  onBack,
  onApprove,
  onReject,
}: {
  venue: VenueRow;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const t = useT();
  const [tables, setTables] = useState<VenueTable[]>([]);
  const [gatherings, setGatherings] = useState<VenueGathering[]>([]);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState<VenueRow>(venue);
  const [rejectGathering, setRejectGathering] = useState<VenueGathering | null>(null);
  const runGetUser = useServerFn(getAdminUser);
  const runSetGathering = useServerFn(setGatheringStatus);

  useEffect(() => {
    supabase
      .from("venue_tables")
      .select("id, label, capacity")
      .eq("business_id", venue.id)
      .then(({ data }) => setTables((data as VenueTable[]) ?? []));
  }, [venue.id]);

  useEffect(() => {
    supabase
      .from("gatherings")
      .select("id, subject, starts_at, seats, status, host_id, gathering_attendees(user_id, checked_in_at)")
      .eq("business_id", venue.id)
      .order("starts_at", { ascending: true })
      .then(({ data }) => setGatherings((data as VenueGathering[]) ?? []));
  }, [venue.id, tick]);

  useEffect(() => {
    runGetUser({ data: { id: venue.owner_id } })
      .then((u) => setOwnerEmail(u?.email ?? null))
      .catch(() => setOwnerEmail(null));
  }, [venue.owner_id, runGetUser]);

  async function approveGathering(id: string) {
    try {
      await runSetGathering({ data: { id, status: "approved" } });
      toast.success(t("admin.set.approved"));
      setTick((n) => n + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function rejectGatheringWithReason(id: string, reason: string) {
    await runSetGathering({ data: { id, status: "rejected", reason } });
    toast.success(t("admin.set.rejected"));
    setTick((n) => n + 1);
  }

  const pendingGs = gatherings.filter((g) => g.status === "proposed");
  const approvedGs = gatherings.filter((g) => g.status === "approved");

  return (
    <div>
      <button className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={onBack}>
        <span aria-hidden className="inline-block rtl:rotate-180">←</span> {t("admin.venue.back")}
      </button>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">{venue.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {venue.city ?? "—"} · {venue.address ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("admin.venue.owner")}: {ownerEmail ?? venue.owner_id}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">status: {venue.status}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing((v) => !v)}>
              {editing ? t("admin.user.cancel") : t("admin.venue.edit")}
            </Button>
            {venue.status === "pending" && (
              <>
                <Button size="sm" className="rounded-full" onClick={onApprove}>
                  {t("admin.approve")}
                </Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={onReject}>
                  {t("admin.reject")}
                </Button>
              </>
            )}
          </div>
        </div>

        {editing && (
          <VenueEditForm
            venue={current}
            onCancel={() => setEditing(false)}
            onSaved={async () => {
              setEditing(false);
              const { getAdminBusiness } = await import("@/lib/business.functions");
              const data = await getAdminBusiness({ data: { id: venue.id } });
              if (data) setCurrent(data as VenueRow);

            }}
          />
        )}


        <div className="mt-6 grid gap-2">
          <h3 className="font-display text-lg">
            {t("admin.venue.tables")} ({tables.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {tables.map((tb) => (
              <span key={tb.id} className="rounded-full border border-border px-3 py-1 text-xs">
                #{tb.label} · {tb.capacity}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-6">
        <h3 className="font-display text-lg">{t("admin.venue.pendingGatherings")}</h3>
        {pendingGs.length === 0 ? (
          <Empty text={t("admin.venue.noPendingGatherings")} />
        ) : (
          <div className="mt-3 grid gap-3">
            {pendingGs.map((g) => (
              <GatheringRow key={g.id} g={g}>
                <Button size="sm" className="rounded-full" onClick={() => approveGathering(g.id)}>
                  {t("admin.approve")}
                </Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setRejectGathering(g)}>
                  {t("admin.reject")}
                </Button>
              </GatheringRow>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h3 className="font-display text-lg">{t("admin.venue.approvedGatherings")}</h3>
        {approvedGs.length === 0 ? (
          <Empty text={t("admin.venue.noApprovedGatherings")} />
        ) : (
          <div className="mt-3 grid gap-3">
            {approvedGs.map((g) => (
              <GatheringRow key={g.id} g={g} />
            ))}
          </div>
        )}
      </section>

      <RejectReasonDialog
        open={!!rejectGathering}
        title={rejectGathering ? `Reject "${rejectGathering.subject}"` : ""}
        onClose={() => setRejectGathering(null)}
        onConfirm={async (reason) => {
          if (rejectGathering) await rejectGatheringWithReason(rejectGathering.id, reason);
          setRejectGathering(null);
        }}
      />
    </div>
  );
}

function GatheringRow({ g, children }: { g: VenueGathering; children?: React.ReactNode }) {
  const { lang } = useI18n();
  const t = useT();
  const rows = g.gathering_attendees ?? [];
  const isPast = new Date(g.starts_at).getTime() < Date.now();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <div className="font-display text-base">{g.subject}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {formatDateTime(g.starts_at, lang)} · {g.seats} seats
          {isPast && rows.length > 0
            ? ` · ${t("att.attendedOf", { done: rows.filter((r) => r.checked_in_at).length, total: rows.length })}`
            : ""}
        </div>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}


// ------------------------------ Users ------------------------------

function UsersSection() {
  const t = useT();
  const { lang } = useI18n();
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const runList = useServerFn(listAdminUsers);

  useEffect(() => {
    runList()
      .then((rows) => setUsers(rows))
      .catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
  }, [runList]);

  if (selectedId) {
    return <UserDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  if (users === null) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }
  if (users.length === 0) {
    return <Empty text={t("admin.users.empty")} />;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="text-start text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">{t("admin.users.name")}</th>
            <th className="px-4 py-3">{t("admin.users.email")}</th>
            <th className="px-4 py-3">{t("admin.users.signedUp")}</th>
            <th className="px-4 py-3">{t("admin.users.verified")}</th>
            <th className="px-4 py-3">{t("admin.users.role")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u.id}
              className="cursor-pointer border-t border-border hover:bg-muted/40"
              onClick={() => setSelectedId(u.id)}
            >
              <td className="px-4 py-3 font-medium">{u.display_name ?? "—"}</td>
              <td className="px-4 py-3">{u.email ?? "—"}</td>
              <td className="px-4 py-3">{new Date(u.created_at).toLocaleDateString(lang)}</td>
              <td className="px-4 py-3">{u.email_confirmed_at ? "✓" : "—"}</td>
              <td className="px-4 py-3">{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const t = useT();
  const { lang } = useI18n();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const runGet = useServerFn(getAdminUser);

  useEffect(() => {
    setLoading(true);
    runGet({ data: { id } })
      .then(async (u) => {
        setUser(u);
        if (u?.avatar_url) {
          const { data } = await supabase.storage.from("avatars").createSignedUrl(u.avatar_url, 3600);
          setAvatarUrl(data?.signedUrl ?? null);
        }
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [id, runGet]);

  const socials = useMemo(() => {
    if (!user?.social_links) return [] as [string, string][];
    return Object.entries(user.social_links).filter(([, v]) => typeof v === "string" && v);
  }, [user]);

  return (
    <div>
      <button className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={onBack}>
        <span aria-hidden className="inline-block rtl:rotate-180">←</span> {t("admin.users.back")}
      </button>
      {loading || !user ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-muted">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-display">
                    {(user.display_name || user.email || "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-display text-2xl">{user.display_name ?? "—"}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing((v) => !v)}>
                {editing ? t("admin.user.cancel") : t("admin.user.edit")}
              </Button>
            </div>

            {editing && (
              <UserEditForm
                user={user}
                onCancel={() => setEditing(false)}
                onSaved={() => {
                  setEditing(false);
                  runGet({ data: { id } }).then((u) => setUser(u));
                }}
              />
            )}

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label={t("admin.user.country")} value={user.country ? countryName(user.country) : null} />
              <Field label={t("admin.user.city")} value={user.city} />
              <Field label={t("admin.users.role")} value={user.role} />
              <Field label={t("admin.users.signedUp")} value={new Date(user.created_at).toLocaleString(lang)} />
              <Field label={t("admin.users.verified")} value={user.email_confirmed_at ? "✓" : "—"} />
            </dl>

            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">{t("admin.user.bio")}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm">{user.bio ?? t("admin.user.none")}</p>
            </div>

            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">{t("admin.user.interests")}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {user.interests.length ? (
                  user.interests.map((i) => (
                    <span key={i} className="rounded-full border border-border px-3 py-1 text-xs">
                      {i}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">{t("admin.user.none")}</span>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">{t("admin.user.social")}</h3>
              {socials.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">{t("admin.user.none")}</p>
              ) : (
                <ul className="mt-2 grid gap-1 text-sm">
                  {socials.map(([k, v]) => (
                    <li key={k}>
                      <span className="text-muted-foreground">{k}:</span>{" "}
                      <a href={v} target="_blank" rel="noopener noreferrer" className="underline">
                        {v}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

// ------------------------------ Gatherings queue ------------------------------

function GatheringsSection() {
  const t = useT();
  const { lang } = useI18n();
  const runList = useServerFn(listPendingGatherings);
  const runSet = useServerFn(setGatheringStatus);
  const [rows, setRows] = useState<PendingGatheringRow[] | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingGatheringRow | null>(null);

  function refresh() {
    runList()
      .then((r) => setRows(r))
      .catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(id: string) {
    try {
      await runSet({ data: { id, status: "approved" } });
      toast.success(t("admin.set.approved"));
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function reject(id: string, reason: string) {
    await runSet({ data: { id, status: "rejected", reason } });
    toast.success(t("admin.set.rejected"));
    refresh();
  }

  if (rows === null) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  if (rows.length === 0) return <Empty text={t("admin.gatherings.empty")} />;

  return (
    <div className="grid gap-3">
      {rows.map((g) => (
        <div key={g.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-display text-lg">{g.subject}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("admin.gatherings.venue")}: {g.business_name ?? "—"}
                {g.business_city ? ` · ${g.business_city}` : ""}
                {g.table_label ? ` · ${t("admin.gatherings.table")} ${g.table_label}` : ""}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("admin.gatherings.host")}: {g.host_name ?? g.host_id.slice(0, 8)} ·{" "}
                {t("admin.gatherings.when")}: {formatDateTime(g.starts_at, lang)} · {g.seats} seats
              </div>
              {g.description && <p className="mt-2 text-sm">{g.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="rounded-full" onClick={() => approve(g.id)}>
                {t("admin.approve")}
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setRejectTarget(g)}>
                {t("admin.reject")}
              </Button>
            </div>
          </div>
        </div>
      ))}
      <RejectReasonDialog
        open={!!rejectTarget}
        title={rejectTarget ? `Reject "${rejectTarget.subject}"` : ""}
        onClose={() => setRejectTarget(null)}
        onConfirm={async (reason) => {
          if (rejectTarget) await reject(rejectTarget.id, reason);
          setRejectTarget(null);
        }}
      />
    </div>
  );
}

function RejectReasonDialog({
  open,
  title,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) setReason("");
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || "Reject"}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (required)"
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            disabled={busy || !reason.trim()}
            onClick={async () => {
              setBusy(true);
              try { await onConfirm(reason.trim()); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
              setBusy(false);
            }}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------ Edit forms ------------------------------

export function UserEditForm({
  user,
  onCancel,
  onSaved,
}: {
  user: AdminUserDetail;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const runUpdate = useServerFn(updateAdminUser);
  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [country, setCountry] = useState(user.country ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    try {
      setSaving(true);
      await runUpdate({
        data: {
          id: user.id,
          patch: {
            display_name: displayName.trim() || null,
            bio: bio.trim() || null,
            country: country || null,
            city: city.trim() || null,
          },
        },
      });
      toast.success(t("admin.user.saved"));
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-2">
        <Label>{t("profile.displayName")}</Label>
        <Input value={displayName} maxLength={80} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>{t("profile.bio")}</Label>
        <Textarea value={bio} maxLength={500} rows={3} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{t("admin.user.country")}</Label>
          <Select
            value={country || undefined}
            onValueChange={(v) => {
              setCountry(v);
              if (!citiesFor(v).includes(city)) setCity("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("profile.selectCountry")} />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t("admin.user.city")}</Label>
          {citiesFor(country).length > 0 ? (
            <Select value={city || undefined} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder={t("profile.selectCity")} />
              </SelectTrigger>
              <SelectContent>
                {citiesFor(country).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={city} maxLength={120} onChange={(e) => setCity(e.target.value)} />
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} className="rounded-full">
          {t("admin.user.cancel")}
        </Button>
        <Button onClick={save} disabled={saving} className="rounded-full">
          {saving ? "…" : t("admin.user.save")}
        </Button>
      </div>
    </div>
  );
}

export function VenueEditForm({
  venue,
  onCancel,
  onSaved,
}: {
  venue: VenueRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const [name, setName] = useState<string>(venue.name);
  const [city, setCity] = useState<string>(venue.city ?? "");
  const [address, setAddress] = useState<string>(venue.address ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("businesses")
        .update({ name: name.trim(), city: city.trim() || undefined, address: address.trim() || undefined })
        .eq("id", venue.id);
      if (error) throw error;
      toast.success(t("admin.venue.saved"));
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 grid gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-2">
        <Label>{t("venueDash.name")}</Label>
        <Input value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{t("venueDash.city")}</Label>
          <Input value={city} maxLength={120} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>{t("venueDash.address")}</Label>
          <Input value={address} maxLength={300} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} className="rounded-full">
          {t("admin.user.cancel")}
        </Button>
        <Button onClick={save} disabled={saving} className="rounded-full">
          {saving ? "…" : t("admin.venue.save")}
        </Button>
      </div>
    </div>
  );
}

// ------------------------------ Saved locations ------------------------------

type SavedLocRow = {
  id: string;
  label: string;
  address: string;
  city: string | null;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  user_id: string;
  created_at: string;
};

function SavedLocationsAdminSection() {
  const t = useT();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [rows, setRows] = useState<SavedLocRow[] | null>(null);
  const [owners, setOwners] = useState<Record<string, { display_name: string | null }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SavedLocRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    setRows(null);
    const { data, error } = await supabase
      .from("saved_locations")
      .select("id,label,address,city,status,reject_reason,user_id,created_at")
      .eq("status", tab)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    const list = (data ?? []) as SavedLocRow[];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length) {
      const { getPublicProfiles } = await import("@/lib/public-data.functions");
      const profs = await getPublicProfiles({ data: { ids } });
      const map: Record<string, { display_name: string | null }> = {};
      for (const p of profs) map[p.id] = { display_name: p.display_name };
      setOwners(map);
    } else {
      setOwners({});
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function setStatus(row: SavedLocRow, status: "approved" | "rejected", reason?: string) {
    setBusy(row.id);
    const patch: { status: "approved" | "rejected"; reject_reason: string | null } = {
      status,
      reject_reason: status === "rejected" ? reason?.trim() || null : null,
    };
    const { error } = await supabase.from("saved_locations").update(patch).eq("id", row.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    try {
      await insertNotification({
        recipient_id: row.user_id,
        type: status === "approved" ? "saved_location_approved" : "saved_location_rejected",
        title: status === "approved" ? t("notif.savedLoc.approved.title") : t("notif.savedLoc.rejected.title"),
        body:
          status === "approved"
            ? t("notif.savedLoc.approved.body")
            : reason?.trim() || null,
        related_id: row.id,
      });
    } catch (e) {
      // non-fatal
      console.warn("notify saved-loc failed", e);
    }
    toast.success(status === "approved" ? t("admin.savedLoc.set.approved") : t("admin.savedLoc.set.rejected"));
    load();
  }

  return (
    <div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending">{t("admin.savedLoc.pending")}</TabsTrigger>
          <TabsTrigger value="approved">{t("admin.savedLoc.approved")}</TabsTrigger>
          <TabsTrigger value="rejected">{t("admin.savedLoc.rejected")}</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {rows === null ? (
            <p className="text-sm text-muted-foreground">…</p>
          ) : rows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t(`admin.savedLoc.empty.${tab}` as never)}
            </p>
          ) : (
            <div className="grid gap-3">
              {rows.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{r.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {r.address}
                        {r.city ? ` · ${r.city}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("admin.savedLoc.owner")}: {owners[r.user_id]?.display_name ?? r.user_id.slice(0, 8)} ·{" "}
                        {formatDateTime(r.created_at)}
                      </p>
                      {r.status === "rejected" && r.reject_reason && (
                        <p className="mt-1 text-xs text-destructive">{r.reject_reason}</p>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={busy === r.id}
                          onClick={() => setStatus(r, "approved")}
                          className="rounded-full"
                        >
                          {t("admin.approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === r.id}
                          onClick={() => {
                            setRejectTarget(r);
                            setRejectReason("");
                          }}
                          className="rounded-full"
                        >
                          {t("admin.reject")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectTarget} onOpenChange={(v) => !v && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.savedLoc.rejectTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>{t("savedLoc.reason")}</Label>
            <Textarea
              value={rejectReason}
              maxLength={500}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || busy === rejectTarget?.id}
              onClick={async () => {
                if (!rejectTarget) return;
                await setStatus(rejectTarget, "rejected", rejectReason);
                setRejectTarget(null);
              }}
            >
              {t("admin.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ------------------------------ Reports ------------------------------

function ReportsSection() {
  const t = useT();
  const [tab, setTab] = useState<"open" | "resolved" | "dismissed">("open");
  const [rows, setRows] = useState<AdminReportRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    setRows(null);
    try {
      setRows(await listReports({ data: { status: tab } }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setRows([]);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function decide(row: AdminReportRow, status: "resolved" | "dismissed") {
    try {
      setBusy(row.id);
      await setReportStatus({ data: { id: row.id, status, note: notes[row.id] ?? null } });
      toast.success(status === "resolved" ? t("admin.reports.resolved") : t("admin.reports.dismissed"));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="open">{t("admin.reports.tab.open")}</TabsTrigger>
          <TabsTrigger value="resolved">{t("admin.reports.tab.resolved")}</TabsTrigger>
          <TabsTrigger value="dismissed">{t("admin.reports.tab.dismissed")}</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {rows === null ? (
            <p className="text-sm text-muted-foreground">…</p>
          ) : rows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t("admin.reports.empty")}
            </p>
          ) : (
            <div className="grid gap-3">
              {rows.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {t(`mod.reason.${r.reason}` as never)} ·{" "}
                        <span className="text-muted-foreground">
                          {r.target_type === "gathering"
                            ? t("admin.reports.targetGathering")
                            : t("admin.reports.targetUser")}
                        </span>
                      </p>
                      <p className="mt-1 text-sm">
                        {r.target_type === "gathering" ? (
                          <Link to="/gatherings/$id" params={{ id: r.target_id }} className="underline">
                            {r.gathering_subject ?? r.target_id.slice(0, 8)}
                          </Link>
                        ) : (
                          (r.target_name ?? r.target_id.slice(0, 8))
                        )}
                      </p>
                      {r.details && <p className="mt-1 text-sm text-muted-foreground">{r.details}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("admin.reports.reporter")}: {r.reporter_name ?? r.reporter_id.slice(0, 8)} ·{" "}
                        {formatDateTime(r.created_at)}
                      </p>
                      {r.admin_note && <p className="mt-1 text-xs text-primary">{r.admin_note}</p>}
                    </div>
                    {r.status === "open" && (
                      <div className="flex flex-col items-end gap-2">
                        <Input
                          value={notes[r.id] ?? ""}
                          placeholder={t("admin.reports.notePlaceholder")}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          className="w-56"
                        />
                        <div className="flex items-center gap-2">
                          <Button size="sm" disabled={busy === r.id} className="rounded-full" onClick={() => decide(r, "resolved")}>
                            {t("admin.reports.resolve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === r.id}
                            className="rounded-full"
                            onClick={() => decide(r, "dismissed")}
                          >
                            {t("admin.reports.dismiss")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
