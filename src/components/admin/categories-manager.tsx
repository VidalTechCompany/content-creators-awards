"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin/fetch";
import type { AdminRole, CategoryRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CategoriesManager({ role }: { role: AdminRole }) {
  const isSuper = role === "super_admin";
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", section: "", description: "", sort_order: "0" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ categories: CategoryRow[] }>("/api/admin/categories");
      setItems(data.categories);
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
    if (!isSuper) return;
    try {
      await adminFetch("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          section: form.section,
          description: form.description || null,
          sort_order: Number(form.sort_order) || 0,
        }),
      });
      toast.success("Category created");
      setForm({ title: "", section: "", description: "", sort_order: "0" });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function remove(id: string) {
    if (!isSuper || !confirm("Delete this category and its nominees?")) return;
    try {
      await adminFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      {isSuper ? (
        <Card>
          <CardHeader>
            <CardTitle>Add category</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={create}>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Section label</Label>
                <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sort order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>
              <div className="flex items-end">
                <Button type="submit">Create</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-zinc-500">Moderators can view categories; only super admins can create or delete.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All categories ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : (
            items.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3"
              >
                <div>
                  <p className="font-medium text-amber-50">{c.title}</p>
                  <p className="text-xs text-zinc-500">
                    {c.section} · /{c.slug} · order {c.sort_order}
                  </p>
                </div>
                {isSuper ? (
                  <Button variant="destructive" size="sm" onClick={() => void remove(c.id)}>
                    Delete
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
