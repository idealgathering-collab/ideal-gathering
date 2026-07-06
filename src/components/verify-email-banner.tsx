import { useState } from "react";
import { toast } from "sonner";
import { MailWarning } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function VerifyEmailBanner({ email }: { email: string | null | undefined }) {
  const [sending, setSending] = useState(false);

  async function resend() {
    if (!email) return;
    try {
      setSending(true);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success("Verification email sent. Check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-sunshine bg-sunshine/30 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium">Verify your email to continue</p>
          <p className="text-xs text-foreground/70">
            We sent a link to {email ?? "your inbox"}. Confirm it to propose or join gatherings.
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={sending || !email}
        onClick={resend}
        className="rounded-full"
      >
        {sending ? "Sending…" : "Resend email"}
      </Button>
    </div>
  );
}
