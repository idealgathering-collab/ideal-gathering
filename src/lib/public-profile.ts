/**
 * Safe-column projection shared by the public-profile server function and its
 * callers. Deliberately excludes nationality, gender, and social links.
 */
export const PUBLIC_PROFILE_COLUMNS = `
  id,
  display_name,
  avatar_url,
  cover_url,
  city,
  neighborhood,
  country,
  bio,
  date_of_birth,
  persona_color,
  trait_spark,
  trait_curiosity,
  trait_warmth,
  trait_depth,
  energy_level,
  group_size,
  talk_style,
  new_people_pref,
  interests,
  intentions,
  created_at,
  updated_at
`;

export type PublicProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  city: string | null;
  neighborhood: string | null;
  country: string | null;
  bio: string | null;
  date_of_birth: string | null;
  persona_color: string | null;
  trait_spark: number | null;
  trait_curiosity: number | null;
  trait_warmth: number | null;
  trait_depth: number | null;
  energy_level: string | null;
  group_size: string | null;
  talk_style: string | null;
  new_people_pref: string | null;
  interests: unknown;
  intentions: unknown;
  created_at: string;
  updated_at: string;
};

/**
 * Keeps age display accurate to the year while hiding the exact birthday.
 */
export function coarsenDob(dob: string | null): string | null {
  if (!dob) return null;
  const year = dob.slice(0, 4);
  return /^\d{4}$/.test(year) ? `${year}-01-01` : null;
}
