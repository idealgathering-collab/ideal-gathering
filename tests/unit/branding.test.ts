import { describe, expect, it } from "vitest";
import { brand } from "../../src/config/brand";
import {
  gatheringHead,
  jsonLdGatheringList,
  jsonLdOrganization,
  jsonLdWebSite,
  localizedHead,
  PAGE_SEO,
  SEO_LANGS,
} from "../../src/lib/seo";

describe("configured public branding", () => {
  it.each(SEO_LANGS)("uses the brand throughout %s metadata", (lang) => {
    for (const path of Object.keys(PAGE_SEO)) {
      const serialized = JSON.stringify(localizedHead(path, lang));
      expect(serialized).toContain(brand.name);
      expect(serialized).not.toContain("Ideal Gathering");
    }
    expect(JSON.stringify(jsonLdWebSite(lang))).not.toContain("Ideal Gathering");
    expect(JSON.stringify(jsonLdGatheringList([], lang))).not.toContain("Ideal Gathering");
    expect(jsonLdOrganization(lang).logo).toBe(new URL(brand.logoUrl, brand.siteUrl).href);
  });

  it.each(SEO_LANGS)("brands missing and fallback gathering metadata in %s", (lang) => {
    for (const gathering of [
      null,
      {
        id: "branding-test",
        subject: "Coffee",
        starts_at: "2030-01-01T10:00:00Z",
        seats: 4,
        status: "approved",
      },
    ]) {
      const serialized = JSON.stringify(gatheringHead(gathering, lang, "branding-test"));
      expect(serialized).toContain(brand.name);
      expect(serialized).not.toContain("Ideal Gathering");
    }
  });
});
