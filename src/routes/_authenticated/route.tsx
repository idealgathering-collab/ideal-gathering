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
    // Admins are exempt: they can move freely between all panels.
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .in("role", ["venue", "admin"]);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    const isVenue = (roles ?? []).some((r) => r.role === "venue");
    if (isVenue && !isAdmin) {
      throw redirect({ to: "/venue/dashboard" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
