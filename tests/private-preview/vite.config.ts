import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
const file = (name: string) => fileURLToPath(new URL(name, import.meta.url));
export default defineConfig({
  root: file("./"),
  plugins: [react(), tailwind()],
  resolve: { alias: [
    { find: "@/lib/gathering-coordination.functions", replacement: file("./coordination-fixtures.tsx") },
    { find: "@tanstack/react-router", replacement: file("./router.tsx") },
    { find: "@/integrations/supabase/client", replacement: file("./fixtures.tsx") },
    { find: "@/hooks/use-session", replacement: file("./fixtures.tsx") },
    { find: "@/components/site-header", replacement: file("./fixtures.tsx") },
    { find: "@/lib/public-data.functions", replacement: file("./fixtures.tsx") },
    { find: "@/lib/guest-invitations.functions", replacement: file("./guest-fixtures.tsx") },
    { find: "@/components/saved-location-dialog", replacement: file("./fixtures.tsx") },
    { find: "@", replacement: file("../../src") },
  ] },
  server: { host: "127.0.0.1", port: 4196 },
});
