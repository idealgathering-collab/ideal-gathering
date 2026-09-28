import { createFileRoute } from "@tanstack/react-router";
import { brand } from "@/config/brand";

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
            background_color: "#fffbf5",
            theme_color: brand.themeColor,
            icons: [
              { src: "/havato-mark.svg", sizes: "any", type: "image/svg+xml" },
              { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
            ],
          },
          { headers: { "Content-Type": "application/manifest+json" } },
        ),
    },
  },
});
