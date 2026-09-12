import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { verifyOwnerAccess } from "@/lib/owner-access.functions";

export const Route = createFileRoute("/_control")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/admin/auth" });
    // Independent of member beta, venue ownership and preview-mode state.
    await verifyOwnerAccess();
    return { user: data.user };
  },
  component: () => <Outlet />,
});
