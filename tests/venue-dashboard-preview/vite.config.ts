// Actual route/components/CSS with synthetic data boundaries; no hosted services.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
const path = (value: string) => fileURLToPath(new URL(value, import.meta.url));
const fixture = path("./fixtures.tsx");
export default defineConfig({
  root: path("./"),
  envDir: path("./"),
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      "@/lib/business.functions": fixture,
      "@/lib/owner-venue.functions": fixture,
      "@/lib/venue-dashboard.functions": fixture,
      "@/lib/access": fixture,
      "@/lib/beta-gate": fixture,
      "@/integrations/supabase/client": fixture,
      "@/hooks/use-session": fixture,
      "@/components/notifications-bell": fixture,
      "@/components/location-map-picker": fixture,
      "@/components/verify-email-banner": fixture,
      "@tanstack/react-start": fixture,
      "@tanstack/react-router": fixture,
      "@": path("../../src"),
    },
  },
  server: { host: "127.0.0.1", port: 55444, strictPort: true },
});
