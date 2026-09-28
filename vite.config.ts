import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import { publicSupabaseConfig, oauthProvider, requireHttpUrl } from "./src/config/environment";

// Deliberately separate from the legacy root .env used by Lovable.
export default defineConfig(({ mode, command }) => {
  const envDir = fileURLToPath(new URL("./env", import.meta.url));
  const env = loadEnv(mode, envDir, "VITE_");
  publicSupabaseConfig(env);
  oauthProvider(env);
  requireHttpUrl(env.VITE_SITE_URL, "VITE_SITE_URL");
  return {
    envDir,
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      tanstackStart({
        server: { entry: "server" },
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
      }),
      ...(command === "build" ? [nitro({ preset: "node-server" })] : []),
      react(),
    ],
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
  };
});
