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
      if (path === "/admin" || path.startsWith("/admin/") || path === "/owner" || path.startsWith("/owner/")) {
        throw redirect({ to: "/admin/auth" });
      }
      throw redirect({ to: "/auth", search: { redirect: location.href, mode: "signin" } });
    }

    const roles = await fetchRoles(data.user.id);
    const isOwner = roles.has("owner");
    const isAdmin = roles.has("admin");
    const isVenue = roles.has("venue");
    const privileged = isOwner || isAdmin;
    const path = location.pathname;
    const onPrivilegedSurface =
      path === "/admin" ||
      path.startsWith("/admin/") ||
      path === "/owner" ||
      path.startsWith("/owner/");

    // Venue accounts stay in their own portal unless they are privileged.
    if (isVenue && !privileged) {
      throw redirect({ to: "/venue/dashboard" });
    }

    // Owner is the highest-level home; admin remains the staff console.
    if (!isAdminPreview() && !onPrivilegedSurface) {
      if (isOwner) throw redirect({ to: "/owner", replace: true });
      if (isAdmin) throw redirect({ to: "/admin", replace: true });
    }

    if (!privileged) {
      // Private beta: the product stays closed until launch, and only for
      // members who finished setting up. Onboarding itself stays reachable.
      const access = await fetchAccessState(data.user.id);
      const onOnboarding = path === "/onboarding" || path.startsWith("/onboarding/");
      if (!access.hasProductAccess && !onOnboarding) {
        throw redirect({ to: "/pending", replace: true });
      }
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
