import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  MOMENT_MEDIA_BUCKET,
  MOMENT_PHOTO_TTL_SECONDS,
  createMomentSchema,
  updateMomentSchema,
  momentIdSchema,
  ownMomentsSchema,
  visibleMomentsSchema,
  photoUploadSchema,
  momentPhotoPath,
  assertMomentPhotoPath,
} from "./life-moments";

async function withPhoto<T extends { photo_path: string | null }>(row: T) {
  const { photo_path, ...safe } = row;
  if (!photo_path) return { ...safe, photoUrl: null };
  // Only rows authorized by the caller's own-row query or safe projection reach
  // this private helper. Viewers have no raw bucket SELECT/signing permission.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from(MOMENT_MEDIA_BUCKET)
    .createSignedUrl(photo_path, MOMENT_PHOTO_TTL_SECONDS);
  if (error) throw new Error("Moment photo unavailable");
  return { ...safe, photoUrl: data.signedUrl };
}

export const loadOwnLifeMoments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ownMomentsSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("life_moments")
      .select("*")
      .eq("user_id", context.userId)
      .order("happened_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return Promise.all(
      (rows ?? []).map(async (row) => {
        // Media outages must not hide saved text or its owner privacy controls.
        try {
          return { ...row, ...(await withPhoto(row)) };
        } catch {
          return { ...row, photoUrl: null };
        }
      }),
    );
  });

export const loadVisibleLifeMoments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => visibleMomentsSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("list_visible_life_moments", {
      _user_id: data.userId,
      _limit: data.limit,
    });
    if (error) throw new Error(error.message);
    // RPC cannot return notes, gathering IDs, participants or locations.
    return Promise.all((rows ?? []).map((row) => withPhoto(row)));
  });

export const createLifeMoment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createMomentSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("life_moments")
      .insert({ ...data, user_id: context.userId })
      .select("*")
      .single();
    // A competing tab/retry may already have saved this gathering. Return that
    // caller-owned row without overwriting its personal context.
    if (error?.code === "23505" && data.gathering_id) {
      const { data: existing, error: readError } = await context.supabase
        .from("life_moments")
        .select("*")
        .eq("user_id", context.userId)
        .eq("gathering_id", data.gathering_id)
        .maybeSingle();
      if (!readError && existing) return { ...existing, alreadyExists: true };
    }
    if (error) throw new Error(error.message);
    return { ...row, alreadyExists: false };
  });

/** Exact own lookup, never a bounded timeline scan; no other user's notes returned. */
export const loadGatheringLifeMoment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ gatheringId: z.uuid() }).strict().parse(d))
  .handler(async ({ data, context }) => {
    const [prefill, own] = await Promise.all([
      context.supabase.rpc("get_gathering_moment_context", { _gathering_id: data.gatheringId }),
      context.supabase
        .from("life_moments")
        .select("*")
        .eq("user_id", context.userId)
        .eq("gathering_id", data.gatheringId)
        .maybeSingle(),
    ]);
    if (prefill.error || own.error) throw new Error("Moment unavailable");
    // Signing failure must not prevent reading/editing a saved text-only memory.
    const moment = own.data ? { ...own.data, photoUrl: null as string | null } : null;
    if (moment?.photo_path) {
      try {
        moment.photoUrl = (await withPhoto(moment)).photoUrl;
      } catch {
        /* retry on next open */
      }
    }
    const contextRow: { id: string; title: string; happened_at: string; place: string } | null =
      prefill.data?.length ? prefill.data[0] : null;
    return { prefill: contextRow, moment };
  });

export const updateLifeMoment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateMomentSchema.parse(d))
  .handler(async ({ data, context }) => {
    assertMomentPhotoPath(data.patch.photo_path, context.userId, data.id);
    const { data: row, error } = await context.supabase
      .from("life_moments")
      .update(data.patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Moment not found");
    return row;
  });

/** Hiding is updateLifeMoment({id, patch: {visibility: 'private'}}). */
export const deleteLifeMoment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => momentIdSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("life_moments")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Moment not found");
    // Deletion revokes new media reads. Private orphan cleanup is separate from
    // deleting the record; never risk deleting an unrelated user's object.
    return { deleted: true };
  });

export const createLifeMomentPhotoUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => photoUploadSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error: readError } = await context.supabase
      .from("life_moments")
      .select("id")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (readError || !row) throw new Error("Moment not found");
    const path = momentPhotoPath(context.userId, data.id, crypto.randomUUID(), data.extension);
    const { data: upload, error } = await context.supabase.storage
      .from(MOMENT_MEDIA_BUCKET)
      .createSignedUploadUrl(path, { upsert: false });
    if (error) throw new Error("Moment upload unavailable");
    return { path, token: upload.token, signedUrl: upload.signedUrl };
  });
