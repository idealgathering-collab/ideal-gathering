import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PublicProfileRow } from "./public-profile";

/** Compatibility name: this is a relationship-gated member read, never public. */
export const loadPublicProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).strict().parse(d))
  .handler(async ({ data, context }): Promise<PublicProfileRow | null> => {
    const { data: rows, error } = await context.supabase.rpc("get_member_profile", {
      _user_id: data.userId,
    });
    if (error) throw new Error("Member profile unavailable");
    const row = rows?.[0];
    if (!row) return null;
    let avatar: string | null = null;
    // Only sign the target's avatar; never load arbitrary remote tracking URLs.
    const avatarPattern = new RegExp(`^${data.userId}/avatar\\.(?:jpg|jpeg|png|webp)$`, "i");
    if (row.avatar_url && avatarPattern.test(row.avatar_url)) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const result = await supabaseAdmin.storage
          .from("avatars")
          .createSignedUrl(row.avatar_url, 60);
        if (!result.error) avatar = result.data.signedUrl;
      } catch {
        // Identity remains useful during a media outage.
      }
    }
    return {
      display_name: row.display_name,
      avatar_url: avatar,
      city: row.city,
      bio: row.bio,
      interests: strings(row.interests),
      intentions: strings(row.intentions),
      energy_level: row.energy_level,
      group_size: row.group_size,
      talk_style: row.talk_style,
      new_people_pref: row.new_people_pref,
    };
  });

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
