import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/i18n";
import { GatheringMoment } from "@/components/gathering-moment";
import "@/styles.css";
createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <main
        style={{
          maxWidth: new URLSearchParams(location.search).has("mobile") ? 375 : 768,
          margin: "auto",
          padding: 16,
        }}
      >
        <p>IG-004 · synthetic component preview</p>
        <GatheringMoment
          gatheringId="123e4567-e89b-42d3-a456-426614174000"
          userId="123e4567-e89b-42d3-a456-426614174001"
        />
      </main>
      <Toaster />
    </QueryClientProvider>
  </LanguageProvider>,
);
