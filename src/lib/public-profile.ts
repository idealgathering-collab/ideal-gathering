/** Minimal in-app member projection; no owner history or private identity. */
export type PublicProfileRow = {
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  interests: string[];
  intentions: string[];
  energy_level: string | null;
  group_size: string | null;
  talk_style: string | null;
  new_people_pref: string | null;
};
