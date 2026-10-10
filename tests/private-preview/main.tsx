import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "../../src/i18n";
import { Route } from "../../src/routes/_authenticated/create-gathering";
import { PrivateGatheringInvitations } from "../../src/components/private-gathering-invitations";
import { GuestInvitation } from "../../src/components/guest-invitation";
import { GatheringCoordination } from "../../src/components/gathering-coordination";
import "../../src/styles.css";
const mode = new URLSearchParams(location.search).get("mode");
if (mode === "external") {
  if (!location.hash) history.replaceState(null,"",location.pathname+location.search+"#"+"A".repeat(43));
  window.fetch = async (_input, init) => {
    const input = JSON.parse(String(init?.body));
    return Response.json({ subject: "چای و گفت‌وگو / Tea together", starts_at: "2027-01-01T12:00:00Z", venue_name: "خانهٔ مریم / Maryam’s home", address: "راهنمای رسیدن به محل خصوصی", description: "یک عصر دوستانه و ساده", response: input.response ?? "invited", guest_name: input.name ?? null, expires_at: "2027-01-01T12:00:00Z" });
  };
}
const Create = Route.component as () => React.ReactNode;
createRoot(document.getElementById("root")!).render(<LanguageProvider><QueryClientProvider client={new QueryClient()}>
  {mode?.startsWith("coord-") ? <main className="mx-auto grid max-w-2xl gap-5 px-4 py-10"><GatheringCoordination gatheringId="63000000-0000-4000-8000-000000000001" section="tasks" /><GatheringCoordination gatheringId="63000000-0000-4000-8000-000000000001" section="notesExpenses" /></main> : mode === "external" ? <GuestInvitation /> : mode ? <main className="mx-auto max-w-2xl px-4 py-10"><PrivateGatheringInvitations gatheringId="fixture" userId={mode === "host" ? "host" : "guest"} isHost={mode === "host"} open /></main> : <Create />}
</QueryClientProvider></LanguageProvider>);
