import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { fetchAccessState } from "@/lib/access";
import { fetchRoles } from "@/lib/roles";

/**
 * Shared closed-beta gate for member surfaces that live outside the
 * `_authenticated` subtree (browse catalogue, gathering detail).
 */
export async function requireProductAccess(location: { pathname: string; href: string }) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/auth", search: { redirect: location.href, mode: "signin" } });
  }

  const access = await fetchAccessState(data.user.id);
  if (access.isOwner || access.isAdmin) return { user: data.user };
  if (access.isVenue) {
    throw redirect({ to: "/pending", search: { as: "venue" }, replace: true });
  }
  if (!access.hasProductAccess) {
    throw redirect({ to: access.onboarded ? "/pending" : "/onboarding", replace: true });
  }
  return { user: data.user };
}

/** Venue dashboard is a post-launch surface. Owners/admins can always enter. */
export async function requireVenueAccess() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/venue/auth" });
  }

  const roles = await fetchRoles(data.user.id);
  const privileged = roles.has("owner") || roles.has("admin");
  if (!roles.has("venue") && !privileged) {
    throw redirect({ to: "/" });
  }
  if (privileged) return { user: data.user };

  const access = await fetchAccessState(data.user.id);
  if (!access.hasVenueAccess) {
    throw redirect({ to: "/pending", search: { as: "venue" }, replace: true });
  }

  return { user: data.user };
}

/** Pre-launch page where a venue can submit its business once. */
export async function requireVenueRegistrationAccess() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/venue/auth" });
  }

  const roles = await fetchRoles(data.user.id);
  const privileged = roles.has("owner") || roles.has("admin");
  if (!roles.has("venue") && !privileged) {
    throw redirect({ to: "/" });
  }
  if (privileged) return { user: data.user };

  const access = await fetchAccessState(data.user.id);
  if (access.hasBusiness) {
    throw redirect({
      to: access.hasVenueAccess ? "/venue/dashboard" : "/pending",
      search: access.hasVenueAccess ? undefined : { as: "venue" },
      replace: true,
    });
  }

  return { user: data.user };
}
