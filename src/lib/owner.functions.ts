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

export const getOwnerSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OwnerSnapshot> => {
    await assertOwner(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [
      betaRes,
      waitlistRes,
      venuesRes,
      pendingRes,
      approvedRes,
      profilesRes,
      invitesRes,
      redeemedRes,
      gatheringsTodayRes,
      recentWaitlist,
      recentVenues,
      recentProfiles,
      recentGatherings,
      recentInvites,
    ] = await Promise.all([
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
      supabaseAdmin.from("waitlist").select("name, email, city, created_at").order("created_at", { ascending: false }).limit(10),
      supabaseAdmin.from("businesses").select("name, city, status, created_at").order("created_at", { ascending: false }).limit(10),
      supabaseAdmin.from("profiles").select("display_name, city, created_at").order("created_at", { ascending: false }).limit(10),
      supabaseAdmin.from("gatherings").select("subject, status, created_at").order("created_at", { ascending: false }).limit(10),
      supabaseAdmin.from("invitations").select("email, status, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    const activities: OwnerActivity[] = [
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
      .slice(0, 25);

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
      recentActivity: activities,
    };
  });
