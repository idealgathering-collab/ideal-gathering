// Deliberately no Supabase credentials/client; all preview data stays in memory.
import type { Database } from "@/integrations/supabase/types";
type Moment = Database["public"]["Tables"]["life_moments"]["Row"];
const params = new URLSearchParams(location.search);
const prefill = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  title: "Dinner at Lavash",
  happened_at: "2026-09-18T17:00:00Z",
  place: "Lavash · Yerevan",
};
let moment: Moment | null = null;
export const useServerFn = <T>(fn: T) => fn;
export async function loadGatheringLifeMoment() {
  if (params.has("load-error")) throw Error("Synthetic load failure");
  return {
    prefill: params.has("ineligible") ? null : prefill,
    moment: moment ? { ...moment, photoUrl: null } : null,
  };
}
export async function createLifeMoment({ data }: { data: Partial<Moment> }) {
  if (params.has("save-error")) throw Error("Synthetic save failure");
  const alreadyExists = !!moment;
  moment ??= {
    id: crypto.randomUUID(),
    user_id: "123e4567-e89b-42d3-a456-426614174001",
    gathering_id: prefill.id,
    title: prefill.title,
    happened_at: prefill.happened_at,
    note: null,
    photo_path: null,
    visibility: "private",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...data,
  };
  return { ...moment, alreadyExists };
}
export async function updateLifeMoment({ data }: { data: { patch: Partial<Moment> } }) {
  if (!moment || params.has("save-error")) throw Error("Synthetic save failure");
  Object.assign(moment, data.patch);
  return moment;
}
export async function createLifeMomentPhotoUpload() {
  return { path: "synthetic", token: "synthetic" };
}
export const supabase = {
  storage: {
    from: () => ({
      uploadToSignedUrl: async () => ({
        error: params.has("photo-error") ? new Error("Synthetic photo failure") : null,
      }),
    }),
  },
};
