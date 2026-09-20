import { z } from "zod";

export const MOMENT_MEDIA_BUCKET = "life-moment-media";
export const MOMENT_PHOTO_TTL_SECONDS = 60;
export const momentVisibility = z.enum(["private", "profile"]);
const title = z.string().trim().min(1).max(160);
const note = z.string().max(2000).nullable();
const happenedAt = z.iso
  .datetime({ offset: true })
  .refine((value) => Date.parse(value) <= Date.now(), "Moment must be in the past");
export const createMomentSchema = z
  .object({
    title,
    gathering_id: z.uuid().nullable().default(null),
    note: note.optional(),
    happened_at: happenedAt,
    visibility: momentVisibility.default("private"),
  })
  .strict();
export const updateMomentSchema = z
  .object({
    id: z.uuid(),
    patch: z
      .object({
        title: title.optional(),
        note: note.optional(),
        happened_at: happenedAt.optional(),
        visibility: momentVisibility.optional(),
        photo_path: z.string().max(160).nullable().optional(),
      })
      .strict()
      .refine((value) => Object.keys(value).length > 0, "Empty patch"),
  })
  .strict();
export const momentIdSchema = z.object({ id: z.uuid() }).strict();
export const ownMomentsSchema = z
  .object({ limit: z.number().int().min(1).max(100).default(50) })
  .strict();
export const visibleMomentsSchema = ownMomentsSchema.extend({ userId: z.uuid() });
export const photoUploadSchema = momentIdSchema.extend({
  extension: z.enum(["jpg", "png", "webp"]),
});

/** Private bucket object name; random object IDs prevent overwriting previously signed content. */
export function momentPhotoPath(
  userId: string,
  momentId: string,
  objectId: string,
  extension: "jpg" | "png" | "webp",
) {
  z.uuid().parse(userId);
  z.uuid().parse(momentId);
  z.uuid().parse(objectId);
  z.enum(["jpg", "png", "webp"]).parse(extension);
  return `${userId}/${momentId}/${objectId}.${extension}`;
}

export function assertMomentPhotoPath(
  path: string | null | undefined,
  userId: string,
  momentId: string,
) {
  if (path == null) return;
  const parts = path.split("/");
  if (parts.length !== 3 || parts[0] !== userId || parts[1] !== momentId)
    throw new Error("Invalid moment photo");
  const match = /^([0-9a-f-]{36})\.(jpg|png|webp)$/.exec(parts[2]);
  if (!match || !z.uuid().safeParse(match[1]).success) throw new Error("Invalid moment photo");
}
