import { supabase } from '@/integrations/supabase/client';
import { joinHavatoWaitlist } from './havato-waitlist';

/** Existing waitlist + Supabase identity; profile creation remains the Auth trigger's job. */
export async function registerWaitingUser(input: {
  name: string; email: string; password: string; returnUrl: string;
}) {
  await joinHavatoWaitlist(input, row => supabase.from('waitlist').insert(row));
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(), password: input.password,
    options: {
      emailRedirectTo: input.returnUrl,
      data: { display_name: input.name.trim(), account_type: 'user' },
    },
  });
  if (error) throw error;
  return data;
}
