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
      "@/lib/public-profile.functions": path("./fixtures.tsx"),
      "@/lib/life-moments.functions": path("./fixtures.tsx"),
      "@/lib/moderation.functions": path("./fixtures.tsx"),
      "@/hooks/use-session": path("./fixtures.tsx"),
      "@/components/site-header": path("./fixtures.tsx"),
      "@tanstack/react-start": path("./fixtures.tsx"),
      "@tanstack/react-router": path("./fixtures.tsx"),
      "@": path("../../src"),
    },
  },
  server: { host: "127.0.0.1", port: 55443, strictPort: true },
});
