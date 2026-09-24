import { describe, expect, it } from "vitest";
import { momentPhotoExtension } from "@/lib/gathering-moment";
import { createMomentSchema } from "@/lib/life-moments";
import { translations } from "@/i18n/translations";

describe("gathering moment form boundaries", () => {
  it.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ])("accepts %s up to the bucket limit", (type, extension) => {
    expect(momentPhotoExtension({ type, size: 5 * 1024 * 1024 })).toBe(extension);
  });
  it.each([
    { type: "image/jpeg", size: 0 },
    { type: "image/png", size: 5242881 },
    { type: "image/svg+xml", size: 100 },
    { type: "text/html", size: 100 },
  ])("rejects unsafe/empty/oversized photo %o", (file) => {
    expect(momentPhotoExtension(file)).toBeNull();
  });
  it("prefilled core information is sufficient; private is the default", () => {
    expect(
      createMomentSchema.parse({
        title: "Dinner",
        happened_at: "2020-01-01T12:00:00Z",
        gathering_id: "123e4567-e89b-42d3-a456-426614174000",
      }),
    ).toMatchObject({ title: "Dinner", visibility: "private" });
  });
  it("all new user-facing copy is available in both other supported languages", () => {
    for (const key of Object.keys(translations.en).filter((key) => key.startsWith("moment."))) {
      expect(translations.ru[key], key).toBeTruthy();
      expect(translations.fa[key], key).toBeTruthy();
    }
  });
});
