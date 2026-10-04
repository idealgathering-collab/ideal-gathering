import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { legalContactHref } from "../../src/config/legal";
import { legalCopy } from "../../src/components/landing/havato-legal-copy";

describe("legal document navigation and contact configuration", () => {
  for (const language of ["fa", "en"] as const) {
    for (const document of ["terms", "privacy"] as const) {
      it(`${language} ${document} has unique anchor targets and safe renderable text`, () => {
        const sections = legalCopy[language][document].sections;
        const ids = sections.map((section) => section.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).not.toContain("contact");
        for (const id of ids) expect(id).toMatch(/^[a-z][a-z-]+$/);
        const html = renderToStaticMarkup(
          createElement(
            "article",
            {},
            sections.map((section) =>
              createElement(
                "section",
                { id: section.id, key: section.id },
                createElement("h2", {}, section.title),
                ...section.paragraphs.map((text, index) =>
                  createElement("p", { key: index }, text),
                ),
              ),
            ),
          ),
        );
        expect(html).not.toMatch(
          /<script|mailto:|idealgathering\.com|Armenia|Yerevan|ارمنستان|ایروان/i,
        );
      });
    }
  }
  it("keeps equivalent anchor navigation across language switches", () => {
    for (const document of ["terms", "privacy"] as const) {
      expect(legalCopy.fa[document].sections.map((section) => section.id)).toEqual(
        legalCopy.en[document].sections.map((section) => section.id),
      );
    }
  });
  it("does not turn empty or unsafe contact settings into links", () => {
    for (const value of [
      "",
      "not a url",
      "javascript:alert(1)",
      "http://example.com",
      "mailto:unconfirmed@example.com",
    ]) {
      expect(legalContactHref(value)).toBeNull();
    }
    expect(legalContactHref("https://example.com/contact")).toBe("https://example.com/contact");
  });
});
