/* eslint-disable react-refresh/only-export-components -- Isolated synthetic UI/data boundaries. */
import type { AnchorHTMLAttributes, ComponentType } from "react";
const params = new URLSearchParams(location.search);
let blocked = false;
export const useServerFn = <T,>(fn: T) => fn;
export const useSession = () => ({ user: { id: "viewer" } });
export const createFileRoute = () => (options: { component: ComponentType }) => ({
  options,
  useParams: () => ({ id: params.has("self") ? "viewer" : "target" }),
});
export function Link({ to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  return <a {...props} href={to} />;
}
export function Navigate({ to }: { to: string; replace?: boolean }) {
  return <p>Own profile redirect: {to}</p>;
}
export const SiteHeader = () => (
  <header className="border-b border-border p-4 text-sm">
    Ideal Gathering · Synthetic member preview
  </header>
);
export async function loadPublicProfile() {
  if (params.has("loading")) await new Promise(() => {});
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (params.has("error")) throw Error("Hidden failure detail");
  if (blocked || params.has("unavailable")) return null;
  return {
    display_name: "Alex Morgan",
    avatar_url: null,
    city: "Yerevan",
    bio: params.has("empty")
      ? null
      : "Good conversations, city walks, and learning something new together.",
    interests: params.has("empty") ? [] : ["Coffee", "Hiking", "Reading"],
    intentions: [],
    energy_level: params.has("empty") ? null : "calm",
    group_size: null,
    talk_style: params.has("empty") ? null : "deep",
    new_people_pref: params.has("empty") ? null : "warm_up",
  };
}
export async function loadVisibleLifeMoments() {
  return params.has("empty")
    ? []
    : [
        {
          id: "moment",
          title: "A walk worth remembering",
          happened_at: "2026-09-18T12:00:00Z",
          photoUrl: null,
        },
      ];
}
export async function blockUser() {
  if (params.has("block-error")) throw Error("Synthetic failure");
  blocked = true;
  return { ok: true };
}
export const REPORT_REASONS = ["harassment", "spam", "unsafe", "noshow", "other"] as const;
export async function submitReport() {
  if (params.has("report-error")) throw Error("Synthetic failure");
  return { ok: true };
}
