import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n";
import { authReturnUrl } from "@/lib/auth-return";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResendConfirmation({
  initialEmail = "",
  redirect,
}: {
  initialEmail?: string;
  redirect?: string;
}) {
  const t = useT();
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!seconds) return;
    const timer = window.setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  async function resend(event: React.FormEvent) {
    event.preventDefault();
    if (busy || seconds) return;
    const parsed = z.string().trim().email().max(255).safeParse(email);
    if (!parsed.success) {
      setMessage(t("auth.invalidEmail"));
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: parsed.data,
        options: { emailRedirectTo: authReturnUrl(window.location.origin, redirect) },
      });
      setSeconds(60);
      setMessage(t(error ? "auth.resend.failed" : "auth.resend.sent"));
    } catch {
      setSeconds(60);
      setMessage(t("auth.resend.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={resend} className="mt-4 grid gap-3">
      <Label htmlFor="confirmation-email">{t("auth.email")}</Label>
      <Input
        id="confirmation-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        maxLength={255}
      />
      <Button type="submit" variant="outline" disabled={busy || seconds > 0}>
        {busy
          ? t("auth.submitting")
          : seconds
            ? t("auth.resend.wait", { seconds })
            : t("auth.resend")}
      </Button>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </form>
  );
}
