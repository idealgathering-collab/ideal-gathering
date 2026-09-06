import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { fetchRoles, isAdminPreview } from "@/lib/roles";
import { fetchAccessState } from "@/lib/access";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const path = location.pathname;
      if (path === "/admin" || path.startsWith("/admin/")) {
        throw redirect({ to: "/admin/auth" });
      }
      throw redirect({ to: "/auth", search: { redirect: location.href, mode: "signin" } });
    }
    // Venue accounts stay in the venue portal.
    // Admins default to /admin (see dashboard beforeLoad); they may preview the guest app.
    const roles = await fetchRoles(data.user.id);
    const isAdmin = roles.has("admin");
    const isVenue = roles.has("venue");
    if (isVenue && !isAdmin) {
      throw redirect({ to: "/venue/dashboard" });
    }
    const path = location.pathname;
    const onOwnerSurface = path === "/admin" || path.startsWith("/admin/");
    if (isAdmin && !isAdminPreview() && !onOwnerSurface) {
      throw redirect({ to: "/admin", replace: true });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
