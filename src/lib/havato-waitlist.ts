import { z } from "zod";

export const havatoWaitlistSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((value) => value.toLowerCase()),
});

export async function joinHavatoWaitlist(
  form: { name: string; email: string },
  insert: (row: {
    name: string;
    email: string;
    city: null;
    interests: null;
  }) => PromiseLike<{ error: { code?: string } | null }>,
) {
  const values = havatoWaitlistSchema.parse(form);
  const { error } = await insert({ ...values, city: null, interests: null });
  if (error && error.code !== "23505") throw error;
  return error ? "existing" : "joined";
}
