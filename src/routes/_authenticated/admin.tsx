import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/i18n";
import { formatDateTime } from "@/lib/gatherings";
import { listAdminUsers, getAdminUser, updateAdminUser, listPendingGatherings, setGatheringStatus, type AdminUserRow, type AdminUserDetail, type PendingGatheringRow } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, citiesFor, countryName } from "@/lib/locations";

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
            <TabsTrigger value="users">{t("admin.section.users")}</TabsTrigger>
          </TabsList>
          <TabsContent value="venues" className="mt-6">
            <VenuesSection />
          </TabsContent>
          <TabsContent value="gatherings" className="mt-6">
            <GatheringsSection />
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <UsersSection />
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
    supabase
      .from("businesses")
      .select("id, name, city, address, cover_url, status, owner_id, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setVenues((data as VenueRow[]) ?? []);
      });
  }, [tick]);

  async function setStatus(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("businesses").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? t("admin.venue.set.approved") : t("admin.venue.set.rejected"));
    setTick((n) => n + 1);
    if (selected?.id === id) setSelected({ ...selected, status });
  }

  if (selected) {
    return (
      <VenueDetail
        venue={selected}
        onBack={() => setSelected(null)}
        onStatus={(s) => setStatus(selected.id, s)}
      />
    );
  }

  const pending = venues.filter((v) => v.status === "pending");
  const approved = venues.filter((v) => v.status === "approved");

  return (
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
                    <Button size="sm" className="rounded-full" onClick={() => setStatus(v.id, "approved")}>
                      {t("admin.approve")}
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => setStatus(v.id, "rejected")}>
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
  );
}

function VenueCard({ v, onOpen, actions }: { v: VenueRow; onOpen: () => void; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <button className="min-w-0 flex-1 text-left" onClick={onOpen}>
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
  onStatus,
}: {
  venue: VenueRow;
  onBack: () => void;
  onStatus: (s: "approved" | "rejected") => void;
}) {
  const t = useT();
  const [tables, setTables] = useState<VenueTable[]>([]);
  const [gatherings, setGatherings] = useState<VenueGathering[]>([]);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState<VenueRow>(venue);
  const runGetUser = useServerFn(getAdminUser);

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
      .select("id, subject, starts_at, seats, status, host_id")
      .eq("business_id", venue.id)
      .order("starts_at", { ascending: true })
      .then(({ data }) => setGatherings((data as VenueGathering[]) ?? []));
  }, [venue.id, tick]);

  useEffect(() => {
    runGetUser({ data: { id: venue.owner_id } })
      .then((u) => setOwnerEmail(u?.email ?? null))
      .catch(() => setOwnerEmail(null));
  }, [venue.owner_id, runGetUser]);

  async function setGStatus(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("gatherings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t(`admin.set.${status}`));
    setTick((n) => n + 1);
  }

  const pendingGs = gatherings.filter((g) => g.status === "proposed");
  const approvedGs = gatherings.filter((g) => g.status === "approved");

  return (
    <div>
      <button className="mb-4 text-sm text-muted-foreground hover:text-foreground" onClick={onBack}>
        ← {t("admin.venue.back")}
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
                <Button size="sm" className="rounded-full" onClick={() => onStatus("approved")}>
                  {t("admin.approve")}
                </Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => onStatus("rejected")}>
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
              const { data } = await supabase.from("businesses").select("*").eq("id", venue.id).maybeSingle();
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
                <Button size="sm" className="rounded-full" onClick={() => setGStatus(g.id, "approved")}>
                  {t("admin.approve")}
                </Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setGStatus(g.id, "rejected")}>
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
    </div>
  );
}

function GatheringRow({ g, children }: { g: VenueGathering; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <div className="font-display text-base">{g.subject}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {formatDateTime(g.starts_at)} · {g.seats} seats
        </div>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

// ------------------------------ Users ------------------------------

function UsersSection() {
  const t = useT();
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
        <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
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
              <td className="px-4 py-3">{new Date(u.created_at).toLocaleDateString()}</td>
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
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
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
        if (u?.cover_url) {
          if (u.cover_url.startsWith("http")) setCoverUrl(u.cover_url);
          else {
            const { data } = await supabase.storage.from("avatars").createSignedUrl(u.cover_url, 3600);
            setCoverUrl(data?.signedUrl ?? null);
          }
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
      <button className="mb-4 text-sm text-muted-foreground hover:text-foreground" onClick={onBack}>
        ← {t("admin.users.back")}
      </button>
      {loading || !user ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="relative h-40 w-full bg-muted">
            {coverUrl && <img src={coverUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="p-6">
            <div className="-mt-16 flex items-end gap-4">
              <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-card bg-muted">
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
              <Field label={t("admin.users.signedUp")} value={new Date(user.created_at).toLocaleString()} />
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
  const runList = useServerFn(listPendingGatherings);
  const runSet = useServerFn(setGatheringStatus);
  const [rows, setRows] = useState<PendingGatheringRow[] | null>(null);

  function refresh() {
    runList()
      .then((r) => setRows(r))
      .catch((e) => toast.error(e instanceof Error ? e.message : String(e)));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(id: string, status: "approved" | "rejected") {
    try {
      await runSet({ data: { id, status } });
      toast.success(t(`admin.set.${status}`));
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
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
                {t("admin.gatherings.when")}: {formatDateTime(g.starts_at)} · {g.seats} seats
              </div>
              {g.description && <p className="mt-2 text-sm">{g.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="rounded-full" onClick={() => act(g.id, "approved")}>
                {t("admin.approve")}
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => act(g.id, "rejected")}>
                {t("admin.reject")}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
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
