import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href, mode: "signin" } });
    }
    // If this account is a venue, keep it inside the venue portal.
    const { data: venueRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "venue")
      .maybeSingle();
    if (venueRole) {
      throw redirect({ to: "/venue/dashboard" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
