// Fixed interest taxonomy used by the profile picker.
// Stored values are the slugs below; labels come from i18n (`interest.<slug>`).
// Legacy free-text interests may still exist on old profiles — render them raw.

export type InterestCategory = {
  /** i18n key suffix: `interest.cat.<id>` */
  id: string;
  tags: string[];
};

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: "food_drink",
    tags: ["coffee", "brunch", "street_food", "wine", "craft_beer", "tea", "baking", "vegan_food"],
  },
  {
    id: "outdoors",
    tags: ["hiking", "camping", "cycling", "beach", "picnics", "road_trips", "gardening", "stargazing"],
  },
  {
    id: "arts_culture",
    tags: ["live_music", "museums", "theatre", "film", "photography", "painting", "poetry", "architecture"],
  },
  {
    id: "games_hobbies",
    tags: ["board_games", "video_games", "chess", "puzzles", "cooking", "diy_crafts", "collecting", "cars"],
  },
  {
    id: "sports_fitness",
    tags: ["running", "yoga", "football", "basketball", "swimming", "climbing", "gym", "martial_arts"],
  },
  {
    id: "learning_ideas",
    tags: ["book_clubs", "languages", "startups", "science", "history", "philosophy", "technology", "psychology"],
  },
  {
    id: "nightlife_social",
    tags: ["dancing", "karaoke", "bars", "concerts", "comedy", "festivals", "volunteering", "meetups"],
  },
];

export const INTEREST_TAGS: string[] = INTEREST_CATEGORIES.flatMap((c) => c.tags);

const KNOWN = new Set(INTEREST_TAGS);

export function isKnownInterest(tag: string): boolean {
  return KNOWN.has(tag);
}

/** Max interests a profile can hold. */
export const MAX_INTERESTS = 15;

/** Translate a stored interest slug; legacy free-text falls through unchanged. */
export function interestLabel(t: (key: string) => string, tag: string): string {
  return isKnownInterest(tag) ? t(`interest.${tag}`) : tag;
}
