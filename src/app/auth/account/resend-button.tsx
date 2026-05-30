"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ResendVerificationButton() {
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  async function resend() {
    setLoading(true);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const email = user?.email;
    if (!email) {
      toast.error("No active session");
      setLoading(false);
      return;
    }
    const origin = window.location.origin;
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?next=/auth/account` },
    });
    setLoading(false);
    if (resendError) {
      toast.error(resendError.message);
      return;
    }
    toast.success("Verification email sent");
  }

  return (
    <Button type="button" variant="outline" onClick={resend} disabled={loading}>
      {loading ? "Sending…" : "Resend verification email"}
    </Button>
  );
}
