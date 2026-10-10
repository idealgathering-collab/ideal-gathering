import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "../../src/i18n";
import { Route } from "../../src/routes/_authenticated/create-gathering";
import { PrivateGatheringInvitations } from "../../src/components/private-gathering-invitations";
import "../../src/styles.css";
const mode = new URLSearchParams(location.search).get("mode");
const Create = Route.component as () => React.ReactNode;
createRoot(document.getElementById("root")!).render(<LanguageProvider><QueryClientProvider client={new QueryClient()}>
  {mode ? <main className="mx-auto max-w-2xl px-4 py-10"><PrivateGatheringInvitations gatheringId="fixture" userId={mode === "host" ? "host" : "guest"} isHost={mode === "host"} open /></main> : <Create />}
</QueryClientProvider></LanguageProvider>);
