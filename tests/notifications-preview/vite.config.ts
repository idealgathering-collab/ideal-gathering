// Actual notification UI and push helpers, synthetic sessions/provider/storage.
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
  define: {
    "import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY": JSON.stringify("B" + "A".repeat(86)),
  },
  resolve: {
    alias: {
      "@/integrations/supabase/client": fixture,
      "@/hooks/use-session": fixture,
      "@/lib/push-store": fixture,
      "@/lib/notification-preferences-store": fixture,
      "@": path("../../src"),
    },
  },
  server: { host: "127.0.0.1", port: 55445, strictPort: true },
});
