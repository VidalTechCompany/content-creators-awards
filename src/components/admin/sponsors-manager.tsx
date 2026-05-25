"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin/fetch";
import type { AdminRole, SponsorRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SponsorsManager({ role }: { role: AdminRole }) {
  const isSuper = role === "super_admin";
  const [items, setItems] = useState<SponsorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", logo_url: "", website_url: "", tier: "partner", sort_order: "0" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ sponsors: SponsorRow[] }>("/api/admin/sponsors");
      setItems(data.sponsors);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminFetch("/api/admin/sponsors", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          logo_url: form.logo_url || null,
          website_url: form.website_url || null,
          tier: form.tier,
          sort_order: Number(form.sort_order) || 0,
        }),
      });
      toast.success("Sponsor added");
      setForm({ name: "", logo_url: "", website_url: "", tier: "partner", sort_order: "0" });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      await adminFetch(`/api/admin/sponsors/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !active }),
      });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(id: string) {
    if (!isSuper || !confirm("Delete sponsor?")) return;
    try {
      await adminFetch(`/api/admin/sponsors/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add sponsor</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={create}>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Tier</Label>
              <Input value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button type="submit">Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sponsors ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : (
            items.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3">
                <div>
                  <p className="font-medium text-amber-50">{s.name}</p>
                  <p className="text-xs text-zinc-500">
                    {s.tier} · {s.active ? "active" : "hidden"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void toggleActive(s.id, s.active)}>
                    {s.active ? "Hide" : "Show"}
                  </Button>
                  {isSuper ? (
                    <Button size="sm" variant="destructive" onClick={() => void remove(s.id)}>
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
