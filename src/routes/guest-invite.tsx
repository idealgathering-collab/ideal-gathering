import { createFileRoute } from "@tanstack/react-router";
import { GuestInvitation } from "@/components/guest-invitation";

export const Route = createFileRoute("/guest-invite")({
  head: () => ({ meta: [
    { title: "دعوت خصوصی | Havato" },
    { name: "robots", content: "noindex, nofollow, noarchive" },
    { name: "referrer", content: "no-referrer" },
    { name: "description", content: "Private invitation · دعوت خصوصی" },
  ] }),
  component: GuestInvitation,
});
