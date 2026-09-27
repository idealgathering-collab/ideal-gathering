/* eslint-disable react-refresh/only-export-components -- Deliberate preview-only data and UI boundaries. */
import type { AnchorHTMLAttributes, ComponentType, ReactNode } from "react";
import { venueData, emptyVenueData } from "../fixtures/venue-dashboard";
const params = new URLSearchParams(location.search);
const userId = "123e4567-e89b-42d3-a456-426614174010";
const businessId = "123e4567-e89b-42d3-a456-426614174020";
const business = {
  id: businessId,
  owner_id: userId,
  name: "Willow Café",
  description: "A warm table for good conversations and new connections.",
  address: "12 Garden Street",
  city: "Yerevan",
  lat: 40,
  lng: 44,
  street_number: "12",
  description_extra: "Near the garden",
  phone: "12345678",
  mobile: "12345678",
  cover_url:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%239272bb'/%3E%3C/svg%3E",
  menu_link: "https://example.invalid/menu",
  status: params.has("pending") ? "pending" : params.has("rejected") ? "rejected" : "approved",
};
type Row = { id: string; [key: string]: unknown };
const rows: Record<string, Row[]> = {
  businesses: [business],
  venue_tables: [
    {
      id: "123e4567-e89b-42d3-a456-426614174021",
      business_id: businessId,
      label: "Garden",
      capacity: 5,
    },
  ],
  menu_items: [
    {
      id: "123e4567-e89b-42d3-a456-426614174022",
      business_id: businessId,
      name: "Filter coffee",
      description: "Freshly brewed",
      category: "Drinks",
      price: 3,
      currency: "USD",
      sort_order: 0,
    },
  ],
  gatherings: [],
};
async function delay() {
  if (params.has("loading")) await new Promise(() => {});
  await new Promise((resolve) => setTimeout(resolve, 120));
}
export const createFileRoute = () => (options: { component: ComponentType }) => ({ options });
export const useServerFn = <T,>(fn: T) => fn;
export const useNavigate = () => () => {};
export const useSession = () => ({
  user: {
    id: userId,
    email: "synthetic@example.invalid",
    email_confirmed_at: params.has("unverified") ? null : "2026-01-01",
  },
  loading: false,
});
export const requireVenueAccess = async () => {};
export const fetchAccessState = async () => ({ hasVenueAccess: !params.has("locked") });
export const ClientOnly = ({ children }: { children: ReactNode }) => <>{children}</>;
export const NotificationsBell = () => null;
export const VerifyEmailBanner = () => <p>Email verification required (synthetic fixture)</p>;
export const LocationMapPicker = () => (
  <div className="rounded-2xl bg-muted p-6">Synthetic location · Yerevan</div>
);
export function Link({
  to,
  params: routeParams,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  params?: { id: string };
  search?: unknown;
}) {
  return (
    <a {...props} href={to.replace("$id", routeParams?.id ?? "")}>
      {children}
    </a>
  );
}
export async function getMyBusiness() {
  await delay();
  if (params.has("business-error")) throw Error("Synthetic private failure");
  return { ...business, venue_tables: rows.venue_tables.map((row) => ({ ...row })) };
}
export const getOwnerVenuePreview = getMyBusiness;
export async function loadVenueDashboard() {
  await delay();
  if (params.has("error")) throw Error("Synthetic private failure");
  return params.has("empty") ? emptyVenueData : venueData;
}
export const supabase = {
  auth: { signOut: async () => ({ error: null }) },
  from: (table: string) => {
    let op = "read",
      payload: Record<string, unknown> = {};
    const filters: Record<string, unknown> = {};
    const result = async () => {
      await delay();
      if (params.has("save-error") && op !== "read")
        return { data: null, error: { message: "Synthetic save error" } };
      const matches = (row: Row) => Object.entries(filters).every(([k, v]) => row[k] === v);
      if (op === "insert") rows[table].push({ id: crypto.randomUUID(), ...payload });
      if (op === "update")
        rows[table].filter(matches).forEach((row) => Object.assign(row, payload));
      if (op === "delete") rows[table] = rows[table].filter((row) => !matches(row));
      return { data: rows[table].filter(matches).map((row) => ({ ...row })), error: null };
    };
    const chain = {
      select: () => chain,
      eq: (key: string, value: unknown) => {
        filters[key] = value;
        return chain;
      },
      order: () => chain,
      insert: (data: Record<string, unknown>) => {
        op = "insert";
        payload = data;
        return chain;
      },
      update: (data: Record<string, unknown>) => {
        op = "update";
        payload = data;
        return chain;
      },
      delete: () => {
        op = "delete";
        return chain;
      },
      single: async () => {
        const r = await result();
        return { ...r, data: r.data?.[0] };
      },
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
        result().then(resolve, reject),
    };
    return chain;
  },
};
