"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NomineeLiveVotes({ nomineeId, initial }: { nomineeId: string; initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`nominee-stats-${nomineeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nominee_stats", filter: `nominee_id=eq.${nomineeId}` },
        (payload) => {
          const next = payload.new as { vote_count?: number } | null;
          if (next && typeof next.vote_count === "number") setCount(next.vote_count);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [nomineeId]);

  return <p className="text-xs text-zinc-500">{count.toLocaleString()} votes</p>;
}
