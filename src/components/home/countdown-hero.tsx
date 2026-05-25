// Keep countdown simple and avoid unnecessary client-side state when possible.
"use client";

import { useEffect, useMemo, useState } from "react";

type Props = { deadlineIso: string | null };

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function CountdownHero({ deadlineIso }: Props) {
  const deadline = useMemo(() => (deadlineIso ? new Date(deadlineIso).getTime() : null), [deadlineIso]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!deadline) {
    return (
      <div className="mt-8 rounded-xl border border-amber-500/20 bg-black/40 px-6 py-4 text-center text-sm text-zinc-300 backdrop-blur">
        Voting schedule will be announced soon.
      </div>
    );
  }

  const diff = Math.max(0, deadline - now);
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  const cells = [
    { label: "Days", value: pad(d) },
    { label: "Hours", value: pad(h) },
    { label: "Minutes", value: pad(m) },
    { label: "Seconds", value: pad(s) },
  ];

  return (
    <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-amber-500/25 bg-gradient-to-b from-white/10 to-black/40 px-4 py-4 text-center shadow-lg shadow-amber-900/20 backdrop-blur-md"
        >
          <div className="font-mono text-3xl font-semibold text-amber-200">{c.value}</div>
          <div className="mt-1 text-xs uppercase tracking-widest text-zinc-400">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
