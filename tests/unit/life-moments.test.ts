import { describe, expect, it } from "vitest";
import {
  createMomentSchema,
  updateMomentSchema,
  visibleMomentsSchema,
  momentPhotoPath,
  assertMomentPhotoPath,
} from "@/lib/life-moments";
const user = "22222222-2222-4222-8222-222222222222";
const moment = "33333333-3333-4333-8333-333333333333";
const object = "44444444-4444-4444-8444-444444444444";
const input = { title: " My memory ", happened_at: "2020-01-01T12:00:00Z" };
describe("life moment input boundaries", () => {
  it("defaults to private manual record and trims title", () =>
    expect(createMomentSchema.parse(input)).toEqual({
      ...input,
      title: "My memory",
      visibility: "private",
      gathering_id: null,
    }));
  it.each(["user_id", "photo_path", "created_at", "id"])("rejects injected %s on creation", (key) =>
    expect(() => createMomentSchema.parse({ ...input, [key]: user })).toThrow(),
  );
  it.each(["", " ", "x".repeat(161)])("rejects invalid title %j", (title) =>
    expect(() => createMomentSchema.parse({ ...input, title })).toThrow(),
  );
  it("rejects future dates and arbitrary visibility", () => {
    expect(() =>
      createMomentSchema.parse({ ...input, happened_at: "2999-01-01T00:00:00Z" }),
    ).toThrow();
    expect(() => createMomentSchema.parse({ ...input, visibility: "public" })).toThrow();
  });
  it("supports explicit clearing and hiding without changing other fields", () =>
    expect(
      updateMomentSchema.parse({
        id: moment,
        patch: { note: null, photo_path: null, visibility: "private" },
      }).patch,
    ).toEqual({ note: null, photo_path: null, visibility: "private" }));
  it.each([{}, { user_id: user }, { gathering_id: moment }, { created_at: input.happened_at }])(
    "rejects empty or immutable patch %j",
    (patch) => expect(() => updateMomentSchema.parse({ id: moment, patch })).toThrow(),
  );
  it("bounds queries", () => {
    expect(visibleMomentsSchema.parse({ userId: user }).limit).toBe(50);
    expect(() => visibleMomentsSchema.parse({ userId: user, limit: 101 })).toThrow();
  });
  it("builds owner/moment scoped paths", () => {
    const path = momentPhotoPath(user, moment, object, "jpg");
    expect(path).toBe(`${user}/${moment}/${object}.jpg`);
    expect(() => assertMomentPhotoPath(path, user, moment)).not.toThrow();
  });
  it.each([
    `https://public.test/photo.jpg`,
    `${user}/${object}/${object}.jpg`,
    `${user}/${moment}/../photo.jpg`,
    `${user}/${moment}/${object}.svg`,
  ])("rejects unsafe media reference %s", (path) =>
    expect(() => assertMomentPhotoPath(path, user, moment)).toThrow(),
  );
});
