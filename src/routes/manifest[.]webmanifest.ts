import { createFileRoute } from "@tanstack/react-router";
import { brand, pwaColors } from "@/config/brand";

export const Route = createFileRoute("/manifest.webmanifest")({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          {
            name: brand.name,
            short_name: brand.shortName,
            description:
              "Find a table. Find a topic. Find your people. Cafes and restaurants host gatherings around a subject.",
            start_url: "/",
            display: "standalone",
            background_color: pwaColors.background,
            theme_color: pwaColors.theme,
            icons: [
              { src: "/favicon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
              { src: "/favicon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
              { src: "/havato-app-icon-1024.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
            ],
          },
          { headers: { "Content-Type": "application/manifest+json" } },
        ),
    },
  },
});
