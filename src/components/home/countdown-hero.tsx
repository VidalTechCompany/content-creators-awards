'use client';

import { useEffect, useState } from 'react';

interface CountdownHeroProps {
  deadlineIso: string | null;
}

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const calculateTimeLeft = (deadlineIso: string | null): TimeLeft | null => {
  if (!deadlineIso) {
    return null;
  }

  const deadline = new Date(deadlineIso);
  const now = new Date();
  const difference = deadline.getTime() - now.getTime();

  if (difference <= 0) {
    return null;
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return { days, hours, minutes, seconds };
};

export function CountdownHero({ deadlineIso }: CountdownHeroProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(deadlineIso));

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(deadlineIso));
    }, 1000);

    return () => clearInterval(timer);
  }, [deadlineIso]);

  if (!timeLeft) {
    return (
      <div className="mt-8 rounded-xl border border-amber-500/20 bg-black/40 px-6 py-4 text-center text-sm text-zinc-300 backdrop-blur">
        00
      </div>
    );
  }

  return (
    <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: 'Days', value: String(timeLeft.days).padStart(2, '0') },
        { label: 'Hours', value: String(timeLeft.hours).padStart(2, '0') },
        { label: 'Minutes', value: String(timeLeft.minutes).padStart(2, '0') },
        { label: 'Seconds', value: String(timeLeft.seconds).padStart(2, '0') },
      ].map((cell) => (
        <div
          key={cell.label}
          className="rounded-xl border border-amber-500/25 bg-gradient-to-b from-white/10 to-black/40 px-4 py-4 text-center shadow-lg shadow-amber-900/20 backdrop-blur-md"
        >
          <div className="font-mono text-3xl font-semibold text-amber-200">{cell.value}</div>
          <div className="mt-1 text-xs uppercase tracking-widest text-zinc-400">{cell.label}</div>
        </div>
      ))}
    </div>
  );
}
