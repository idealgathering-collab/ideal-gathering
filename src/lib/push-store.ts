import { supabase } from "@/integrations/supabase/client";
import type { PushStore } from "./web-push";

// Browser uses its authenticated Supabase client; RLS remains authoritative.
export function pushStore(userId: string): PushStore {
  return {
    async save(record) {
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({ ...record, user_id: userId }, { onConflict: "endpoint" });
      if (error) throw new Error("Could not save subscription");
    },
    async remove(endpoint) {
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", endpoint);
      if (error) throw new Error("Could not remove subscription");
    },
    async has(endpoint) {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("endpoint")
        .eq("user_id", userId)
        .eq("endpoint", endpoint)
        .maybeSingle();
      if (error) throw new Error("Could not check subscription");
      return !!data;
    },
  };
}
