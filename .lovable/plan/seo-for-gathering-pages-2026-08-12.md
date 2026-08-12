# SEO for gathering pages

Localized titles, hreflang and JSON-LD already exist for the home, explore, partnership, terms and privacy pages. Gathering detail pages — the pages people actually share — have no metadata at all, and the site has no sitemap, robots.txt or llms.txt. This plan closes those gaps.

## 1. Gathering detail pages get real metadata

Today `/gatherings/$id` inherits the generic site title and description, so every shared gathering link looks identical on Google, WhatsApp and X.

- Fetch the gathering server-side so crawlers see the content in the HTML (a public server function reading only approved gatherings, mirroring the existing public-data pattern).
- Title: the gathering subject plus venue, e.g. "Books & Coffee at Kronotrop — Ideal Gathering" (kept under 60 chars).
- Description: the gathering description, or a generated sentence with date, neighborhood and remaining seats when there is none.
- og:title / og:description matching, og:type `article`, self-referencing og:url and canonical, plus the venue cover image as og:image / twitter:image when one exists.
- Move the existing Event JSON-LD from the component into the route head so it renders server-side.
- Localized (EN/TR/FA) through the existing `?lang=` pattern with hreflang alternates.

Private, past or unapproved gatherings get `noindex` so search engines don't index dead or restricted pages.

## 2. Sitemap

Add a dynamic sitemap at `/sitemap.xml` listing the public routes (home, explore, partnership, terms, privacy, auth) plus one entry per upcoming approved gathering, with `?lang=` alternates. Generated on request so it stays in sync as gatherings come and go. No fabricated lastmod values.

## 3. robots.txt

Add `public/robots.txt` allowing crawlers on public pages and disallowing private surfaces (`/admin`, `/dashboard`, `/chat`, `/my-gatherings`, `/profile`, `/venue/dashboard`, `/reset-password`, `/api`, `/mcp`), with a Sitemap directive pointing at the custom domain.

## 4. llms.txt

Add `public/llms.txt` summarising Ideal Gathering and linking the public pages, so AI assistants can describe the product without crawling everything.

## 5. Sign-in and waitlist metadata

Give `/auth`, `/venue/auth` and `/waitlist` their own titles and descriptions instead of the shared root copy.

## Technical notes

- New `getPublicGathering` server function in `src/lib/public-data.functions.ts` using the publishable client (approved gatherings only).
- Route `loader` on `src/routes/gatherings.$id.tsx` feeding `head({ loaderData })`; component keeps its existing client query for live attendee state.
- New helpers in `src/lib/seo.ts` for the gathering head and the sitemap URL list.
- New `src/routes/sitemap[.]xml.ts` server route; canonical base stays `https://www.idealgathering.com`.

## Not included

The scanner also suggested a "What is a supper club?" content/blog page for search traffic. That's a separate content project — say the word if you want it.
