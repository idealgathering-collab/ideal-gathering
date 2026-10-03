import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
const path = (value: string) => fileURLToPath(new URL(value, import.meta.url));
export default defineConfig({
  root: path("./"),
  envDir: path("./"),
  publicDir: path("../../public"),
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      "@tanstack/react-router": path("./fixtures.tsx"),
      "@/integrations/supabase/client": path("./fixtures.tsx"),
      "@": path("../../src"),
    },
  },
  server: { host: "127.0.0.1", port: 55447, strictPort: true },
});
