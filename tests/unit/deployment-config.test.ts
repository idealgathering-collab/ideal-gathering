import { describe, expect, it } from "vitest";
import { createBrand } from "../../src/config/brand";
import { oauthProvider, publicSupabaseConfig, requireHttpUrl } from "../../src/config/environment";

describe("portable environment contract", () => {
  it("requires explicit public backend settings", () => {
    expect(() => publicSupabaseConfig({})).toThrow("VITE_SUPABASE_URL");
    expect(() => publicSupabaseConfig({ VITE_SUPABASE_URL: "https://backend.example" })).toThrow(
      "VITE_SUPABASE_PUBLISHABLE_KEY",
    );
  });
  it("accepts self-hosted Supabase without a project reference", () => {
    expect(
      publicSupabaseConfig({
        VITE_SUPABASE_URL: "https://backend.example/",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toEqual({ url: "https://backend.example", key: "sb_publishable_test" });
  });
  it.each(["sb_secret_test", `e30.${btoa(JSON.stringify({ role: "service_role" }))}.test`])(
    "rejects privileged browser keys (%s)",
    (key) => {
      expect(() =>
        publicSupabaseConfig({
          VITE_SUPABASE_URL: "https://backend.example",
          VITE_SUPABASE_PUBLISHABLE_KEY: key,
        }),
      ).toThrow("privileged");
    },
  );
  it.each(["javascript:alert(1)", "https://user:password@example.com"])(
    "rejects unsafe URLs",
    (url) => {
      expect(() => requireHttpUrl(url, "TEST_URL")).toThrow();
    },
  );
  it("defaults to direct Supabase OAuth with explicit Lovable opt-in", () => {
    expect(oauthProvider({})).toBe("supabase");
    expect(oauthProvider({ VITE_OAUTH_PROVIDER: "lovable" })).toBe("lovable");
    expect(() => oauthProvider({ VITE_OAUTH_PROVIDER: "typo" })).toThrow();
  });
});

describe("shared brand configuration", () => {
  it("uses Havato defaults and a portable local logo", () => {
    expect(createBrand({})).toMatchObject({
      name: "Havato",
      logoUrl: "/havato-logo.png",
      themeColor: "#E87524",
    });
  });
  it("supports a separate brand/domain without changing the shared product", () => {
    expect(
      createBrand({
        VITE_BRAND_NAME: "Havato",
        VITE_BRAND_SHORT_NAME: "Havato",
        VITE_SITE_URL: "https://havato.example/",
        VITE_BRAND_LOGO_URL: "/havato.png",
        VITE_BRAND_THEME_COLOR: "#123456",
      }),
    ).toMatchObject({
      name: "Havato",
      shortName: "Havato",
      siteUrl: "https://havato.example",
      logoUrl: "/havato.png",
      themeColor: "#123456",
    });
  });
  it("rejects invalid theme values", () => {
    expect(() => createBrand({ VITE_BRAND_THEME_COLOR: "red; color: red" })).toThrow();
  });
});
