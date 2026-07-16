import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: {
  supabase: Awaited<ReturnType<typeof import("@supabase/supabase-js").createClient>>;
  userId: string;
}) {
  const { data, error } = await (context.supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export type AdminUserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  role: string;
};

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const perPage = 200;
    const all: any[] = [];
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(error.message);
      all.push(...data.users);
      if (data.users.length < perPage) break;
    }

    const ids = all.map((u) => u.id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", ids);
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids);
    const roleMap = new Map<string, string>();
    for (const r of roles ?? []) {
      const cur = roleMap.get((r as any).user_id);
      // admin > user
      if (!cur || (r as any).role === "admin") roleMap.set((r as any).user_id, (r as any).role);
    }

    return all
      .map((u) => {
        const p: any = profileMap.get(u.id) ?? {};
        return {
          id: u.id,
          email: u.email ?? null,
          display_name: p.display_name ?? null,
          avatar_url: p.avatar_url ?? null,
          created_at: u.created_at,
          email_confirmed_at: u.email_confirmed_at ?? null,
          role: roleMap.get(u.id) ?? "user",
        };
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  });

export type AdminUserDetail = AdminUserRow & {
  bio: string | null;
  interests: unknown;
  city: string | null;
  social_links: unknown;
  cover_url: string | null;
};

export const getAdminUser = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const d = data as { id?: string };
    if (!d?.id) throw new Error("id required");
    return { id: d.id };
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<AdminUserDetail | null> => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: userRes, error: uErr } = await supabaseAdmin.auth.admin.getUserById(data.id);
    if (uErr) throw new Error(uErr.message);
    if (!userRes.user) return null;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, avatar_url, bio, interests, city, social_links, cover_url")
      .eq("id", data.id)
      .maybeSingle();

    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.id)
      .eq("role", "admin")
      .maybeSingle();

    const p: any = profile ?? {};
    return {
      id: userRes.user.id,
      email: userRes.user.email ?? null,
      created_at: userRes.user.created_at,
      email_confirmed_at: userRes.user.email_confirmed_at ?? null,
      display_name: p.display_name ?? null,
      avatar_url: p.avatar_url ?? null,
      bio: p.bio ?? null,
      interests: p.interests ?? [],
      city: p.city ?? null,
      social_links: p.social_links ?? {},
      cover_url: p.cover_url ?? null,
      role: role ? "admin" : "user",
    };
  });
