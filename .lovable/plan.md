# SEO health check — Ideal Gathering

## What I checked live

- `https://www.idealgathering.com/robots.txt` — 200, sensible allow/disallow rules, sitemap declared.
- `/sitemap.xml` — 200, valid XML with hreflang alternates per URL.
- `/llms.txt` — 200.
- Homepage HTML — has title, description, self-referencing canonical, `og:url`, and en/tr/fa/x-default hreflang, plus three JSON-LD blocks.
- Google Search Console — **no connection is linked to this project**, so there is currently no evidence about indexing, impressions, or crawl errors. That absence is a reporting gap, not a problem with the site.
- The stored SEO scan is from July and is stale, so it is not a reliable picture of today's site.

Technically the site is set up correctly for Google. The open items are visibility (no Search Console) and a few stale copy/meta leftovers.

## Proposed work

### 1. Connect Google Search Console and verify the domain
Link a Search Console connection, verify `https://www.idealgathering.com/` with a meta tag, add the property, and submit the sitemap. This is the only way to see real indexing status, crawl errors, and queries.

### 2. Run a fresh SEO review
Trigger a new scan so the findings panel reflects the current site instead of July's snapshot.

### 3. Fix the stale metadata leftovers found during the live check
- `src/routes/__root.tsx` still carries the old default `title` / `og:title` / `twitter:title` "Ideal Gathering — Meet over coffee". On the homepage the localized tags override title/og:title, but `twitter:title` leaks the old wording into Twitter/X previews and any route that doesn't set its own. Align the root defaults with the current positioning.
- `public/llms.txt` still says "in Istanbul" — inconsistent with the de-cityed landing copy. Reword to the global framing.
- `src/lib/seo.ts` `/auth` description still says "join a table in Istanbul". Reword (this is the one operational page whose copy contradicts the landing page).
- `og:image` currently points at a screenshot on the preview-hosting R2 bucket. Replace with a stable image served from the production domain so previews don't depend on a preview-build artifact.

### 4. Re-run the existing checker
`scripts/seo-check.mjs` already validates robots, sitemap, canonicals, hreflang, and JSON-LD across en/tr/fa — run it after the edits to confirm nothing regressed.

## Not included
No new content pages (e.g. the "what is a supper club" guide the old scan suggested), no changes to other pages' copy, no schema restructuring. Say the word if you want the content route added too.
