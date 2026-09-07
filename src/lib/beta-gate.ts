import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { fetchAccessState } from "@/lib/access";
import { fetchRoles } from "@/lib/roles";

/**
 * Shared closed-beta gate for member surfaces that live outside the
 * `_authenticated` subtree (browse catalogue, gathering detail).
 *
 * Same behaviour as `_authenticated/route.tsx`: signed-out visitors go to
 * sign-in, venue accounts stay in their portal, admins pass through, and
 * members without product access land on `/pending`.
 */
export async function requireProductAccess(location: { pathname: string; href: string }) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/auth", search: { redirect: location.href, mode: "signin" } });
  }

  const access = await fetchAccessState(data.user.id);
  if (access.isAdmin) return { user: data.user };
  if (access.isVenue) {
    throw redirect({ to: "/venue/dashboard", replace: true });
  }
  if (!access.hasProductAccess) {
    throw redirect({ to: access.onboarded ? "/pending" : "/onboarding", replace: true });
  }
  return { user: data.user };
}

/**
 * Gate for the venue dashboard. Only signed-in users with the venue or admin
 * role may enter; everyone else is sent to the venue auth page before render.
 */
export async function requireVenueAccess() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/venue/auth" });
  }

  const roles = await fetchRoles(data.user.id);
  if (!roles.has("venue") && !roles.has("admin")) {
    throw redirect({ to: "/" });
  }
  return { user: data.user };
}

