import { requireHttpUrl, type PublicEnvironment } from "./environment";

// A configuration boundary, not a second product. Localized editorial/legal copy
// stays in the existing dictionaries; future brands can override keys here.
export const brandText: Record<string, Record<string, string>> = {};

export function createBrand(env: PublicEnvironment) {
  const themeColor = env.VITE_BRAND_THEME_COLOR || "#6b21a8";
  if (!/^#[0-9a-f]{6}$/i.test(themeColor))
    throw new Error("VITE_BRAND_THEME_COLOR must be a six-digit hex color");
  return {
    name: env.VITE_BRAND_NAME || "Havato",
    shortName: env.VITE_BRAND_SHORT_NAME || "Havato",
    siteUrl: env.VITE_SITE_URL
      ? requireHttpUrl(env.VITE_SITE_URL, "VITE_SITE_URL")
      : "http://localhost:3000",
    logoUrl: env.VITE_BRAND_LOGO_URL || "/havato-mark.svg",
    tagline: env.VITE_BRAND_TAGLINE || "No One Will Be Alone Anymore",
    description:
      env.VITE_BRAND_DESCRIPTION ||
      "Real tables at real cafés and restaurants. One subject, a few seats, and people worth meeting — join a gathering or host your own.",
    themeColor,
  };
}

export const brand = createBrand({
  VITE_BRAND_NAME: import.meta.env.VITE_BRAND_NAME,
  VITE_BRAND_SHORT_NAME: import.meta.env.VITE_BRAND_SHORT_NAME,
  VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
  VITE_BRAND_LOGO_URL: import.meta.env.VITE_BRAND_LOGO_URL,
  VITE_BRAND_TAGLINE: import.meta.env.VITE_BRAND_TAGLINE,
  VITE_BRAND_DESCRIPTION: import.meta.env.VITE_BRAND_DESCRIPTION,
  VITE_BRAND_THEME_COLOR: import.meta.env.VITE_BRAND_THEME_COLOR,
});
export const logoAsset = { url: brand.logoUrl };
