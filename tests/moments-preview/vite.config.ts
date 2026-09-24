// Isolated component preview with synthetic data. Not an application build/E2E substitute.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
const path = (value: string) => fileURLToPath(new URL(value, import.meta.url));
export default defineConfig({
  root: path("./"),
  envDir: path("./"),
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      "@/lib/life-moments.functions": path("./fixtures.ts"),
      "@/integrations/supabase/client": path("./fixtures.ts"),
      "@tanstack/react-start": path("./fixtures.ts"),
      "@": path("../../src"),
    },
  },
  server: { host: "127.0.0.1", port: 55441, strictPort: true },
});
