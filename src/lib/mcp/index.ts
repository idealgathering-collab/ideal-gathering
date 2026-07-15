import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listUpcomingGatherings from "./tools/list-upcoming-gatherings";
import getGathering from "./tools/get-gathering";
import joinGathering from "./tools/join-gathering";
import leaveGathering from "./tools/leave-gathering";
import myGatherings from "./tools/my-gatherings";
import myBusinesses from "./tools/my-businesses";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ideal-gathering-mcp",
  title: "Ideal Gathering",
  version: "0.1.0",
  instructions:
    "Tools for Ideal Gathering. Discover upcoming gatherings at partner cafes and restaurants, view details, and join or leave a gathering as the signed-in user. Also lists the user's own gatherings and businesses they own.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listUpcomingGatherings,
    getGathering,
    joinGathering,
    leaveGathering,
    myGatherings,
    myBusinesses,
  ],
});
