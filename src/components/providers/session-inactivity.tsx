"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { INACTIVITY_MS } from "@/lib/constants";

export function SessionInactivityProvider() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        if (!supabase) return;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.auth.signOut();
        window.location.href = "/auth/login?reason=inactivity";
      }, INACTIVITY_MS);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return null;
}
