import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/i18n";
import { Route } from "@/routes/venue.dashboard";
import "@/styles.css";
const Dashboard = Route.options.component!;
createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <Dashboard />
      <Toaster />
    </QueryClientProvider>
  </LanguageProvider>,
);
