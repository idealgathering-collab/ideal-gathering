import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PublicProfileRow } from "./public-profile";
import { PUBLIC_PROFILE_COLUMNS, coarsenDob } from "./public-profile";

/**
 * Reads another member's profile.
 *
 * `profiles` RLS only lets a user read their OWN row (plus admins), so the
 * browser client returns null for anyone else. Signed-in members still need to
 * see each other's public card, so this runs server-side with an explicit
 * safe-column projection: no email, no nationality, no gender, and the exact
 * birthday coarsened to the birth year.
 */
export const loadPublicProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<PublicProfileRow | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .select(PUBLIC_PROFILE_COLUMNS)
      .eq("id", data.userId)
      .maybeSingle();

    if (error || !row) return null;

    return { ...row, date_of_birth: coarsenDob(row.date_of_birth) } as PublicProfileRow;
  });
