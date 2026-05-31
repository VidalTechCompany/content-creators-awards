"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin/fetch";
import type { AdminRole, CategoryRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

type CategoryWithSubs = CategoryRow & {
  subcategories?: { id: string; name: string }[];
};

const generateSlug = (text: string) => {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

export function CategoriesManager({ role }: { role: AdminRole }) {
  const isSuper = role === "super_admin";
  const canEdit = role === "super_admin" || role === "moderator";
  const [items, setItems] = useState<CategoryWithSubs[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [subForms, setSubForms] = useState<Record<string, string>>({});
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", section: "", description: "", sort_order: "0" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ categories: CategoryWithSubs[] }>("/api/admin/categories?includeInactive=true");
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
      const res = await adminFetch<{ category?: { id: string } }>("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          section: form.section,
          slug: generateSlug(form.title),
          description: form.description || null,
          sort_order: Number(form.sort_order) || 0,
        }),
      });

      const categoryId = res?.category?.id;

      if (categoryId && form.title.toLowerCase().includes('tiktok dancers')) {
        const defaultSubs = ['Best Male', 'Best Female'];
        const subRequests = defaultSubs.map(subName =>
          adminFetch('/api/admin/subcategories', {
            method: 'POST',
            body: JSON.stringify({
              category_id: categoryId,
              name: subName.trim(),
              slug: generateSlug(subName),
            }),
          })
        );
        await Promise.all(subRequests);
        toast.success("Category created with TikTok Dancers subcategories");
      } else {
        toast.success("Category created");
      }

      setForm({ title: "", section: "", description: "", sort_order: "0" });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function remove(id: string) {
    if (!isSuper || !confirm("Delete this category and its nominees?")) return;
    setDeletingId(id);
    try {
      // Use query parameter to match api/admin/categories/route.ts logic
      await adminFetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function addSub(categoryId: string) {
    const name = subForms[categoryId];

    if (!name?.trim()) {
      toast.error("Please enter a subcategory name");
      return;
    }

    if (!canEdit) return;

    setAddingSubTo(categoryId);
    try {
      await adminFetch("/api/admin/subcategories", {
        method: "POST",
        body: JSON.stringify({
          category_id: categoryId,
          name: name.trim(),
          slug: generateSlug(name) // Ensure slug is provided if required by schema
        }),
      });
      toast.success("Subcategory added");
      setSubForms(prev => ({ ...prev, [categoryId]: "" }));
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add subcategory");
    } finally {
      setAddingSubTo(null);
    }
  }

  async function deleteSub(subId: string) {
    if (!isSuper || !confirm("Delete this subcategory?")) return;
    try {
      // Assuming subcategories API also uses query params for ID
      await adminFetch(`/api/admin/subcategories?id=${subId}`, { method: "DELETE" });
      toast.success("Subcategory deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-6 text-zinc-100">
      {isSuper ? (
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-amber-50">Add Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={create}>
              <div className="space-y-2">
                <Label className="text-zinc-400">Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Section label</Label>
                <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} required className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-zinc-400">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Sort order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="bg-black/40 border-white/10" />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Create</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-zinc-500">Moderators can view categories; only super admins can create or delete.</p>
      )}

      <Card className="bg-zinc-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-amber-50">All Categories ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : (
            items.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-white/5 p-4 space-y-4 bg-black/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-amber-50">{c.title}</p>
                    <p className="text-xs text-zinc-500">
                      Section: <span className="text-amber-400/70">{c.section}</span> · /{c.slug} · order {c.sort_order}
                    </p>
                  </div>
                  {isSuper ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === c.id}
                      onClick={() => void remove(c.id)}
                    >
                      {deletingId === c.id ? "Deleting..." : "Delete"}
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-3 bg-white/5 rounded-md p-3">
                  <Label className="text-[10px] uppercase tracking-wider text-zinc-500">Subcategories</Label>
                  <div className="flex flex-wrap gap-2">
                    {(c.subcategories || []).map((sub) => (
                      <Badge key={sub.id} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-0.5">
                        <span className="text-xs">{sub.name}</span>
                        {isSuper && (
                          <button
                            onClick={() => void deleteSub(sub.id)}
                            className="rounded-full p-0.5 hover:bg-white/10 text-zinc-400 hover:text-rose-400 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                    {(!c.subcategories || c.subcategories.length === 0) && (
                      <p className="text-[10px] text-zinc-600 italic">No subcategories</p>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="New subcategory"
                        className="h-8 text-xs bg-black/40 border-white/5"
                        value={subForms[c.id] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubForms(prev => ({ ...prev, [c.id]: val }));
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void addSub(c.id))}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 border-white/10"
                        onClick={() => void addSub(c.id)}
                        disabled={addingSubTo === c.id}
                      >
                        {addingSubTo === c.id ? <span className="text-[10px]">...</span> : <Plus className="h-3 w-3" />}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
