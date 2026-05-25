"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Settings = {
  voting_open: boolean;
  voting_deadline: string | null;
};

export function SiteSettingsForm({ initial }: { initial: Settings }) {
  const [open, setOpen] = useState(initial.voting_open);
  const [deadline, setDeadline] = useState(
    initial.voting_deadline ? new Date(initial.voting_deadline).toISOString().slice(0, 16) : "",
  );
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    void supabase.auth.getSession();
  }, [supabase]);

  async function save() {
    setLoading(true);
    const iso = deadline ? new Date(deadline).toISOString() : null;
    const res = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        voting_open: open,
        voting_deadline: iso,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Save failed");
      return;
    }
    toast.success("Settings saved");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voting controls</CardTitle>
        <CardDescription>Toggle voting and set the public countdown deadline (ISO time).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-center gap-3 text-sm text-zinc-300">
          <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} />
          Voting open
        </label>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline (local)</Label>
          <Input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <Button type="button" onClick={save} disabled={loading}>
          {loading ? "Saving…" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
