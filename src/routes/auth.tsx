import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Coffee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional().default("signin"),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "At least 6 characters").max(72);
const nameSchema = z.string().trim().min(1, "Enter your name").max(80);

function AuthPage() {
  const { mode, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setIsSignup(mode === "signup"), [mode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect ?? "/dashboard" });
    });
  }, [navigate, redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const em = emailSchema.parse(email);
      const pw = passwordSchema.parse(password);
      setLoading(true);
      if (isSignup) {
        const nm = nameSchema.parse(name);
        const { error } = await supabase.auth.signUp({
          email: em,
          password: pw,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: nm },
          },
        });
        if (error) throw error;
        toast.success("Welcome! You're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      navigate({ to: redirect ?? "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-hero opacity-90" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-primary-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-sunshine">
            <Coffee className="h-4 w-4 text-sunshine-foreground" />
          </span>
          <span className="font-display text-xl">
            Ideal <span className="italic">Gathering</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-plum">
          <h1 className="font-display text-3xl">
            {isSignup ? "Set the table." : "Welcome back."}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup
              ? "Create a venue account to register your cafe or restaurant and host gatherings. Guests, join the waitlist instead."
              : "Sign in to manage your venue and gatherings."}
          </p>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                const result = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (result.error) throw result.error;
                if (result.redirected) return;
                navigate({ to: redirect ?? "/dashboard" });
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Google sign-in failed";
                toast.error(msg);
              } finally {
                setLoading(false);
              }
            }}
            className="mt-6 h-11 w-full rounded-full text-base"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.44-1.7 4.22-5.5 4.22-3.31 0-6-2.74-6-6.12s2.69-6.12 6-6.12c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.83 3.5 14.66 2.5 12 2.5 6.75 2.5 2.5 6.75 2.5 12s4.25 9.5 9.5 9.5c5.48 0 9.12-3.85 9.12-9.28 0-.62-.07-1.1-.16-1.52H12z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>or</span>
            <span className="h-px flex-1 bg-border" />
          </div>


          <form onSubmit={handleSubmit} className="grid gap-4">
            {isSignup && (
              <div className="grid gap-2">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={72} />
            </div>
            <Button type="submit" disabled={loading} className="mt-2 h-11 rounded-full text-base">
              {loading ? "…" : isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setIsSignup((v) => !v)}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {isSignup ? "Have an account? Sign in" : "New here? Create an account"}
          </button>

          <div className="mt-3 text-center text-xs text-muted-foreground">
            Not a venue?{" "}
            <Link to="/waitlist" className="text-primary hover:underline">
              Join the guest waitlist
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
