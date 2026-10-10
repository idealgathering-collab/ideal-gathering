export const useSession = () => ({ user: { id: "host", email: "fixture@example.test", email_confirmed_at: "2026-01-01" } });
export function SiteHeader() { return <header className="border-b border-border px-4 py-4 font-display text-xl text-primary">Havato / هواتو</header>; }
export const SavedLocationDialog = () => null;
export const getPublicProfiles = async () => [{ id: "guest", display_name: "مریم / Maryam" }];
export const listApprovedBusinesses = async () => [];
export const supabase = {
  rpc: async () => ({ error: null }),
  from: (table: string) => {
    const result = table === "gathering_invitations" ? [{ recipient_id: "guest", response: "invited", revoked_at: null }] : table === "profiles" ? { date_of_birth: "1990-01-01", country: "IR" } : [];
    const chain = { select: () => chain, eq: () => chain, order: () => chain, maybeSingle: () => Promise.resolve({ data: result, error: null }),
      then: (fn: (value: unknown) => unknown) => Promise.resolve({ data: result, error: null }).then(fn) };
    return chain;
  },
};
