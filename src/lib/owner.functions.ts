import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertOwner(context: {
  supabase: Awaited<ReturnType<typeof import("@supabase/supabase-js").createClient>>;
  userId: string;
}) {
  const { data, error } = await (context.supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "owner")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export type OwnerActivity = {
  type: "waitlist" | "venue" | "user" | "gathering" | "invite";
  title: string;
  detail: string | null;
  created_at: string;
};

export type OwnerSnapshot = {
  betaLaunched: boolean;
  waitlist: number;
  registeredVenues: number;
  pendingVenues: number;
  approvedVenues: number;
  users: number;
  invitations: number;
  redeemedInvitations: number;
  gatheringsToday: number;
  recentActivity: OwnerActivity[];
};

async function buildActivity(supabaseAdmin: any, limit = 100): Promise<OwnerActivity[]> {
  const [recentWaitlist, recentVenues, recentProfiles, recentGatherings, recentInvites] = await Promise.all([
    supabaseAdmin.from("waitlist").select("name, email, city, created_at").order("created_at", { ascending: false }).limit(limit),
    supabaseAdmin.from("businesses").select("name, city, status, created_at").order("created_at", { ascending: false }).limit(limit),
    supabaseAdmin.from("profiles").select("display_name, city, created_at").order("created_at", { ascending: false }).limit(limit),
    supabaseAdmin.from("gatherings").select("subject, status, created_at").order("created_at", { ascending: false }).limit(limit),
    supabaseAdmin.from("invitations").select("email, status, created_at").order("created_at", { ascending: false }).limit(limit),
  ]);

  return [
    ...((recentWaitlist.data ?? []) as any[]).map((r) => ({
      type: "waitlist" as const,
      title: `${r.name || r.email} joined the waitlist`,
      detail: r.city || r.email || null,
      created_at: r.created_at,
    })),
    ...((recentVenues.data ?? []) as any[]).map((r) => ({
      type: "venue" as const,
      title: `${r.name} registered as a venue`,
      detail: [r.city, r.status].filter(Boolean).join(" · ") || null,
      created_at: r.created_at,
    })),
    ...((recentProfiles.data ?? []) as any[]).map((r) => ({
      type: "user" as const,
      title: `${r.display_name || "New member"} created an account`,
      detail: r.city || null,
      created_at: r.created_at,
    })),
    ...((recentGatherings.data ?? []) as any[]).map((r) => ({
      type: "gathering" as const,
      title: `Gathering created: ${r.subject}`,
      detail: r.status || null,
      created_at: r.created_at,
    })),
    ...((recentInvites.data ?? []) as any[]).map((r) => ({
      type: "invite" as const,
      title: r.status === "redeemed" ? "Invitation redeemed" : "Invitation created",
      detail: r.email || r.status || null,
      created_at: r.created_at,
    })),
  ]
    .filter((a) => !!a.created_at)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit);
}

export const getOwnerSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OwnerSnapshot> => {
    await assertOwner(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [betaRes, waitlistRes, venuesRes, pendingRes, approvedRes, profilesRes, invitesRes, redeemedRes, gatheringsTodayRes, recentActivity] =
      await Promise.all([
        supabaseAdmin.from("app_config").select("beta_launched").maybeSingle(),
        supabaseAdmin.from("waitlist").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("businesses").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("businesses").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabaseAdmin.from("businesses").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("invitations").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("invitations").select("id", { count: "exact", head: true }).eq("status", "redeemed"),
        supabaseAdmin
          .from("gatherings")
          .select("id", { count: "exact", head: true })
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString()),
        buildActivity(supabaseAdmin, 10),
      ]);

    return {
      betaLaunched: betaRes.data?.beta_launched === true,
      waitlist: waitlistRes.count ?? 0,
      registeredVenues: venuesRes.count ?? 0,
      pendingVenues: pendingRes.count ?? 0,
      approvedVenues: approvedRes.count ?? 0,
      users: profilesRes.count ?? 0,
      invitations: invitesRes.count ?? 0,
      redeemedInvitations: redeemedRes.count ?? 0,
      gatheringsToday: gatheringsTodayRes.count ?? 0,
      recentActivity,
    };
  });

export const getOwnerActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OwnerActivity[]> => {
    await assertOwner(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return buildActivity(supabaseAdmin, 150);
  });

export type OwnerDirectorySection = "waitlist" | "users" | "venues" | "invitations" | "gatherings";

export const getOwnerDirectory = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const section = (input as { section?: string })?.section;
    if (!section || !["waitlist", "users", "venues", "invitations", "gatherings"].includes(section)) {
      throw new Error("Invalid owner section");
    }
    return { section: section as OwnerDirectorySection };
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<any[]> => {
    await assertOwner(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.section === "waitlist") {
      const { data: rows, error } = await supabaseAdmin
        .from("waitlist")
        .select("id, name, email, city, interests, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return rows ?? [];
    }

    if (data.section === "users") {
      const perPage = 200;
      const authUsers: any[] = [];
      for (let page = 1; page <= 20; page++) {
        const { data: authPage, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
        if (error) throw new Error(error.message);
        authUsers.push(...authPage.users);
        if (authPage.users.length < perPage) break;
      }
      const ids = authUsers.map((u) => u.id);
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        ids.length
          ? supabaseAdmin.from("profiles").select("id, display_name, city, country, avatar_url").in("id", ids)
          : Promise.resolve({ data: [] }),
        ids.length
          ? supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids)
          : Promise.resolve({ data: [] }),
      ]);
      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const roleMap = new Map<string, string[]>();
      for (const role of roles ?? []) {
        const list = roleMap.get((role as any).user_id) ?? [];
        list.push((role as any).role);
        roleMap.set((role as any).user_id, list);
      }
      return authUsers.map((u) => {
        const p: any = profileMap.get(u.id) ?? {};
        return {
          id: u.id,
          email: u.email ?? null,
          display_name: p.display_name ?? null,
          city: p.city ?? null,
          country: p.country ?? null,
          avatar_url: p.avatar_url ?? null,
          roles: roleMap.get(u.id) ?? ["user"],
          email_confirmed_at: u.email_confirmed_at ?? null,
          created_at: u.created_at,
        };
      });
    }

    if (data.section === "venues") {
      const { data: rows, error } = await supabaseAdmin
        .from("businesses")
        .select("id, name, city, address, status, owner_id, cover_url, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return rows ?? [];
    }

    if (data.section === "invitations") {
      const { data: rows, error } = await supabaseAdmin
        .from("invitations")
        .select("id, code, email, note, status, created_at, expires_at, redeemed_at, redeemed_by")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return rows ?? [];
    }

    const { data: rows, error } = await supabaseAdmin
      .from("gatherings")
      .select("id, subject, description, starts_at, seats, status, host_id, business_id, venue_name, city, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
