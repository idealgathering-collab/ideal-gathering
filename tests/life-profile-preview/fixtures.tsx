/* eslint-disable react-refresh/only-export-components -- This preview intentionally aliases both UI and data boundaries; reload resets all synthetic fixtures. */
// No credentials or real API calls. Deliberate data-boundary fixtures only.
import type { AnchorHTMLAttributes, ComponentType } from "react";
import type { Database } from "@/integrations/supabase/types";
import type { ProfileCardData } from "@/lib/profile-card";
type Moment = Database["public"]["Tables"]["life_moments"]["Row"];
const params = new URLSearchParams(location.search);
const userId = "123e4567-e89b-42d3-a456-426614174001";
const eventId = "123e4567-e89b-42d3-a456-426614174002";
const profile = {
  id: userId,
  display_name: "Alex Morgan",
  bio: "Good conversations, city walks, and learning something new together.",
  date_of_birth: "1994-05-12",
  nationality: "AM",
  gender: "prefer_not_to_say",
  city: "Yerevan",
  country: "AM",
  neighborhood: "Kentron",
  interests: ["coffee", "hiking"],
  social_links: { instagram: "@synthetic" },
  avatar_url: null,
  trait_spark: 63,
  trait_curiosity: 82,
  trait_warmth: 75,
  trait_depth: 70,
};
const preferences = {
  intentions: ["make_friends", "discover_places"],
  gathering_types: ["coffee"],
  social_energy: "calm",
  conversation_style: "deep",
  preferred_group_size: 3,
  stranger_comfort: "comfortable",
  spontaneity: "planner",
};
let moments: Array<Moment & { photoUrl: string | null }> = [
  {
    id: "123e4567-e89b-42d3-a456-426614174003",
    user_id: userId,
    gathering_id: eventId,
    title: "An evening of new stories",
    happened_at: "2026-09-18T17:00:00Z",
    note: "A quiet table, unexpected stories, and a reason to meet again.",
    visibility: "private",
    photo_path: params.has("photo-error") ? "private-unavailable" : null,
    photoUrl: null,
    created_at: "2026-09-18T20:00:00Z",
    updated_at: "2026-09-18T20:00:00Z",
  },
  {
    id: "123e4567-e89b-42d3-a456-426614174004",
    user_id: userId,
    gathering_id: null,
    title: "A walk worth remembering",
    happened_at: "2026-09-12T10:00:00Z",
    note: null,
    visibility: "profile",
    photo_path: null,
    photoUrl: null,
    created_at: "2026-09-12T12:00:00Z",
    updated_at: "2026-09-12T12:00:00Z",
  },
];
async function delay() {
  if (params.has("loading")) await new Promise(() => {});
  await new Promise((resolve) => setTimeout(resolve, 150));
}
export const useServerFn = <T,>(fn: T) => fn;
export const useSession = () => ({ user: { id: userId, email: "synthetic@example.invalid" } });
export const createFileRoute = () => (options: { component: ComponentType }) => ({ options });
export const useNavigate = () => () => {};
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
export const SiteHeader = () => (
  <header className="border-b border-border p-4 text-sm">
    Ideal Gathering · IG-005 synthetic profile preview
  </header>
);
export const SavedLocationsSection = () => (
  <p className="p-4 text-sm">Saved locations fixture — not used as visited places</p>
);
export async function loadProfileCard(): Promise<ProfileCardData> {
  await delay();
  return {
    id: userId,
    displayName: profile.display_name,
    bio: profile.bio,
    city: profile.city,
    country: profile.country,
    neighborhood: profile.neighborhood,
    dateOfBirth: profile.date_of_birth,
    avatarUrl: null,
    coverUrl: null,
    interests: profile.interests,
    intentions: preferences.intentions,
    traitSpark: profile.trait_spark,
    traitCuriosity: profile.trait_curiosity,
    traitWarmth: profile.trait_warmth,
    traitDepth: profile.trait_depth,
    personaColor: null,
    energyLevel: "calm",
    groupSize: "intimate",
    talkStyle: "deep",
    newPeople: "comfortable",
    story: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-09-24T00:00:00Z",
  };
}
export async function loadOwnLifeMoments() {
  await delay();
  if (params.has("load-error")) throw Error("Synthetic load failure");
  return params.has("empty") ? [] : moments.map((m) => ({ ...m }));
}
export async function loadOwnLifeGatherings() {
  await delay();
  if (params.has("load-error")) throw Error("Synthetic load failure");
  return params.has("empty")
    ? []
    : [
        {
          id: eventId,
          title: "Dinner and conversation",
          happened_at: "2026-09-18T17:00:00Z",
          place: "Lavash · Yerevan",
        },
      ];
}
export async function loadGatheringLifeMoment() {
  return { prefill: null, moment: moments[0] };
}
export async function createLifeMoment() {
  throw Error("Not used in this preview");
}
export async function updateLifeMoment({ data }: { data: { id: string; patch: Partial<Moment> } }) {
  await delay();
  if (params.has("save-error")) throw Error("Synthetic save failure");
  moments = moments.map((m) => (m.id === data.id ? { ...m, ...data.patch } : m));
  return moments.find((m) => m.id === data.id)!;
}
export async function createLifeMomentPhotoUpload() {
  return { path: "synthetic", token: "synthetic" };
}
export const supabase = {
  from: (table: string) => {
    const result = async () => {
      await delay();
      return {
        data:
          table === "profiles"
            ? profile
            : table === "user_gathering_preferences"
              ? preferences
              : null,
        error: params.has("profile-error") ? Error("Synthetic profile failure") : null,
      };
    };
    const chain = { select: () => chain, eq: () => chain, single: result, maybeSingle: result };
    return chain;
  },
  rpc: async (_name: string, data: { _profile: object; _preferences: object }) => {
    await delay();
    if (params.has("save-error")) return { data: null, error: Error("Synthetic save failure") };
    Object.assign(profile, data._profile);
    Object.assign(preferences, data._preferences);
    return { data: true, error: null };
  },
  storage: {
    from: () => ({ uploadToSignedUrl: async () => ({ error: Error("Synthetic upload failure") }) }),
  },
};

export async function loadOwnLifeSummary() {
  await delay();
  if (params.has("load-error")) throw Error("Synthetic summary failure");
  const empty = params.has("empty");
  return {
    period_start: "2026-08-27T12:00:00Z",
    period_end: "2026-09-26T12:00:00Z",
    gatherings: empty ? 0 : 6,
    moments: empty ? 0 : 4,
    categories: empty
      ? []
      : [
          { category: "coffee", count: 4 },
          { category: "city", count: 2 },
        ],
    periods: [
      { start: "2026-08-27T12:00:00Z", end: "2026-09-06T12:00:00Z", gatherings: empty ? 0 : 1 },
      { start: "2026-09-06T12:00:00Z", end: "2026-09-16T12:00:00Z", gatherings: empty ? 0 : 3 },
      { start: "2026-09-16T12:00:00Z", end: "2026-09-26T12:00:00Z", gatherings: empty ? 0 : 2 },
    ],
  };
}
