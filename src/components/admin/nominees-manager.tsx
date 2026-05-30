"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Image from "next/image"; // Import the Image component
import { adminFetch } from "@/lib/admin/fetch";
import type { AdminRole, CategoryRow, NomineeRow, NomineeStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy, BarChart3, LayoutList, Trash2, Pencil, X, Check
} from "lucide-react";

type NomineeWithMeta = NomineeRow & {
  categories: { title: string; slug: string } | null;
  subcategories?: { name: string } | null;
  nominee_stats: { vote_count: number } | { vote_count: number }[] | null;
};

export function NomineesManager({
  role,
  initialCategories = [],
  initialNominees = [],
}: {
  role: AdminRole;
  initialCategories?: CategoryRow[];
  initialNominees?: NomineeWithMeta[];
}) {
  const isSuper = role === "super_admin";
  const [view, setView] = useState<"manage" | "analysis">("manage");
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);
  const [nominees, setNominees] = useState<NomineeWithMeta[]>(initialNominees);
  const [filter, setFilter] = useState<NomineeStatus | "all">("all");
  const [loading, setLoading] = useState(initialNominees.length === 0);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category_id: initialCategories[0]?.id || "",
    subcategory_id: initialCategories[0]?.subcategories?.[0]?.id || "",
    name: "",
    known_name: "",
    status: "pending" as NomineeStatus,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [addingSub, setAddingSub] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState("");
  const [updatingSub, setUpdatingSub] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatTitle, setEditingCatTitle] = useState("");
  const [updatingCat, setUpdatingCat] = useState(false);
  const [subSearch, setSubSearch] = useState("");

  const selectedCategory = categories.find(c => c.id === form.category_id);

  const filteredSubcategories = (selectedCategory?.subcategories ?? []).filter(sub =>
    sub.name.toLowerCase().includes(subSearch.toLowerCase())
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, noms] = await Promise.all([
        adminFetch<{ categories: CategoryRow[] }>("/api/admin/categories"),
        adminFetch<{ nominees: NomineeWithMeta[] }>(
          `/api/admin/nominees${filter === "all" ? "" : `?status=${filter}`}`,
        ),
      ]);
      setCategories(cats.categories);
      setNominees(noms.nominees);

      // Only set initial form values if category_id is missing to avoid resetting selections during refreshes
      setForm((f) => {
        if (!f.category_id && cats.categories.length > 0) {
          const nextCategoryId = cats.categories[0].id;
          const selectedCategory = cats.categories.find((c) => c.id === nextCategoryId);
          const nextSubcategoryId = selectedCategory?.subcategories?.[0]?.id || "";
          return { ...f, category_id: nextCategoryId, subcategory_id: nextSubcategoryId };
        }
        return f;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const hasServerData = initialNominees.length > 0 || initialCategories.length > 0;

  useEffect(() => {
    if (!hasServerData) {
      void load();
    }
  }, [hasServerData, load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const categoryId = form.category_id || categories[0]?.id;
    if (!categoryId) {
      toast.error("Please select a category before creating a nominee.");
      return;
    }

    try {
      const res = await adminFetch<{ nominee: { id: string } }>("/api/admin/nominees", {
        method: "POST",
        body: JSON.stringify({
          category_id: categoryId,
          subcategory_id: form.subcategory_id || null,
          name: form.name,
          known_name: form.known_name || null,
          status: form.status,
        }),
      });

      const newNomineeId = res.nominee?.id;

      if (newNomineeId && imageFile) {
        await uploadImage(newNomineeId, imageFile, false);
      }

      toast.success("Nominee created successfully!");
      setForm((prev) => ({
        ...prev,
        name: "",
        known_name: "",
      }));
      setImageFile(null);

      const fileInput = document.getElementById("nominee-image-input") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function createSubcategory() {
    const categoryId = form.category_id || categories[0]?.id;
    if (!categoryId || !newSubName.trim()) return;
    setAddingSub(true);
    try {
      const res = await adminFetch<{ subcategory: { id: string } }>("/api/admin/subcategories", {
        method: "POST",
        body: JSON.stringify({
          category_id: categoryId,
          name: newSubName.trim(),
        }),
      });
      toast.success("Subcategory created successfully!");

      const newSubId = res.subcategory?.id;
      setNewSubName("");

      // Refresh the local data to include the new subcategory
      await load();

      // Automatically select the newly created subcategory
      if (newSubId) {
        setForm(prev => ({ ...prev, subcategory_id: newSubId }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create subcategory");
    } finally {
      setAddingSub(false);
    }
  }

  async function updateSubcategory() {
    if (!editingSubId || !editingSubName.trim()) return;
    setUpdatingSub(true);
    try {
      await adminFetch(`/api/admin/subcategories/${editingSubId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editingSubName.trim() }),
      });
      toast.success("Subcategory updated");
      setEditingSubId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdatingSub(false);
    }
  }

  async function removeSubcategory(id: string) {
    if (
      !isSuper ||
      !confirm("Delete this subcategory permanently? Nominees using it will have their subcategory cleared.")
    )
      return;
    try {
      await adminFetch(`/api/admin/subcategories/${id}`, { method: "DELETE" });
      toast.success("Subcategory deleted");
      if (form.subcategory_id === id) {
        setForm((prev) => ({ ...prev, subcategory_id: "" }));
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function createCategory() {
    if (!newCatTitle.trim()) return;
    setAddingCat(true);
    try {
      await adminFetch("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          title: newCatTitle.trim(),
          slug: newCatTitle.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          section: "General",
        }),
      });
      toast.success("Category created successfully!");
      setNewCatTitle("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setAddingCat(false);
    }
  }

  async function updateCategory() {
    if (!editingCatId || !editingCatTitle.trim()) return;
    setUpdatingCat(true);
    try {
      const cat = categories.find(c => c.id === editingCatId);
      await adminFetch(`/api/admin/categories/${editingCatId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editingCatTitle.trim(),
          slug: editingCatTitle.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          section: cat?.section || "General",
        }),
      });
      toast.success("Category updated");
      setEditingCatId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdatingCat(false);
    }
  }

  async function removeCategory(id: string) {
    if (!isSuper || !confirm("Delete this category permanently? This will fail if it contains nominees or subcategories.")) return;
    try {
      await adminFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      toast.success("Category deleted");
      // Reset selection if the deleted category was selected
      if (form.category_id === id) {
        setForm(prev => ({ ...prev, category_id: "", subcategory_id: "" }));
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function setStatus(id: string, status: NomineeStatus) {
    try {
      await adminFetch(`/api/admin/nominees/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(`Marked as ${status}`);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function uploadImage(nomineeId: string, file: File, shouldReload = true) {
    setUploading(nomineeId);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("nomineeId", nomineeId);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast.success("Image uploaded");
      if (shouldReload) await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function remove(id: string) {
    if (!isSuper || !confirm("Delete this nominee permanently?")) return;
    setDeletingId(id);
    try {
      await adminFetch(`/api/admin/nominees/${id}`, { method: "DELETE" });
      toast.success("Nominee and associated assets deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  function voteCount(n: NomineeWithMeta) {
    const s = n.nominee_stats;
    if (Array.isArray(s)) return s[0]?.vote_count ?? 0;
    return (s as any)?.vote_count ?? 0;
  }

  const getWinners = () => {
    const approved = nominees.filter((n) => n.status === "approved");

    return categories.map((cat) => {
      const catNominees = approved.filter((n) => n.category_id === cat.id);

      const findTopNominees = (list: NomineeWithMeta[]) => {
        if (list.length === 0) return [];
        const maxVotes = Math.max(...list.map(voteCount));
        // Filter for all nominees matching the max vote count to detect ties
        return list.filter((n) => voteCount(n) === maxVotes);
      };

      // Group by subcategories if they exist
      const subWinners = (cat.subcategories || [])
        .map((sub) => {
          const subNominees = catNominees.filter((n) => n.subcategory_id === sub.id);
          const winners = findTopNominees(subNominees);
          return { sub, winners };
        })
        .filter((sw) => sw.winners.length > 0);

      // Overall category winner (useful if no subcategories exist)
      const overallWinners = findTopNominees(catNominees);

      return { category: cat, subWinners, overallWinners };
    });
  };

  if (view === "analysis") {
    const results = getWinners();
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-amber-50 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            Winner Analysis
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView("manage")}>
              <LayoutList className="mr-2 h-4 w-4" />
              Back to Management
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {results.map((res) => (
            <Card key={res.category.id} className="border-amber-500/20 bg-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {res.category.title}
                  <Badge variant="outline" className="border-amber-500/30 text-amber-200">
                    {res.category.section}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {res.overallWinners.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic text-center py-4">No approved nominees in this category yet.</p>
                ) : res.subWinners.length > 0 ? (
                  <div className="grid gap-3">
                    {res.subWinners.map((sw) => (
                      <div key={sw.sub.id} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                        <div className="flex-1">
                          <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">{sw.sub.name}</p>
                          <div className="flex flex-col gap-0.5">
                            {sw.winners.map((w) => (
                              <p key={w.id} className="text-sm font-medium text-amber-50">
                                {w.known_name || w.name}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          {sw.winners.length > 1 ? (
                            <Badge variant="outline" className="mb-1 border-amber-500/50 text-amber-500">Tie</Badge>
                          ) : (
                            <p className="text-xs text-zinc-500 italic">Leader</p>
                          )}
                          <Badge variant="default" className="bg-amber-600" suppressHydrationWarning>
                            {voteCount(sw.winners[0])} votes
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex flex-col gap-0.5">
                          {res.overallWinners.map((w) => (
                            <p key={w.id} className="text-sm font-medium text-amber-50">
                              {w.known_name || w.name}
                            </p>
                          ))}
                        </div>
                        <p className="text-xs text-zinc-500">Highest overall votes</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {res.overallWinners.length > 1 && (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-500">Tie</Badge>
                      )}
                      <Badge variant="default" className="bg-amber-600 px-3 py-1" suppressHydrationWarning>
                        {voteCount(res.overallWinners[0])} votes
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filter === s ? "default" : "outline"}
              onClick={() => setFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={() => setView("analysis")} className="bg-amber-600 hover:bg-amber-700 text-white">
          <BarChart3 className="mr-2 h-4 w-4" />
          View Winners Analysis
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add nominee</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={create}>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Category</Label>
                {form.category_id && isSuper && !editingCatId && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-blue-400 hover:text-blue-500 hover:bg-blue-500/10"
                      onClick={() => {
                        setEditingCatId(form.category_id);
                        setEditingCatTitle(selectedCategory?.title || "");
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => void removeCategory(form.category_id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              {editingCatId ? (
                <div className="flex gap-2">
                  <Input
                    value={editingCatTitle}
                    onChange={(e) => setEditingCatTitle(e.target.value)}
                    className="h-10 text-sm"
                  />
                  <Button type="button" size="sm" onClick={() => void updateCategory()} disabled={updatingCat || !editingCatTitle.trim()}>
                    {updatingCat ? "..." : <Check className="h-4 w-4" />}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingCatId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <select
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-zinc-100"
                  value={form.category_id}
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    const selectedCategory = categories.find((c) => c.id === categoryId);
                    setSubSearch("");
                    setForm({
                      ...form,
                      category_id: categoryId,
                      subcategory_id: selectedCategory?.subcategories?.[0]?.id || "",
                    });
                  }}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="New category title..."
                  value={newCatTitle}
                  onChange={(e) => setNewCatTitle(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => void createCategory()} disabled={addingCat || !newCatTitle.trim()}>
                  {addingCat ? "Adding..." : "Add Category"}
                </Button>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Subcategory</Label>
                {form.subcategory_id && isSuper && !editingSubId && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-blue-400 hover:text-blue-500 hover:bg-blue-500/10"
                      onClick={() => {
                        const sub = selectedCategory?.subcategories?.find((s) => s.id === form.subcategory_id);
                        if (sub) {
                          setEditingSubId(sub.id);
                          setEditingSubName(sub.name);
                        }
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => void removeSubcategory(form.subcategory_id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              {editingSubId ? (
                <div className="flex gap-2">
                  <Input
                    value={editingSubName}
                    onChange={(e) => setEditingSubName(e.target.value)}
                    className="h-10 text-sm"
                  />
                  <Button type="button" size="sm" onClick={() => void updateSubcategory()} disabled={updatingSub || !editingSubName.trim()}>
                    {updatingSub ? "..." : <Check className="h-4 w-4" />}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingSubId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {(selectedCategory?.subcategories?.length ?? 0) > 5 && (
                    <Input
                      placeholder="Search subcategories..."
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      className="h-8 text-xs bg-black/20 border-white/5"
                    />
                  )}
                  <select
                    className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-zinc-100"
                    value={form.subcategory_id}
                    onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                  >
                    <option value="">Choose a subcategory</option>
                    {filteredSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="New subcategory name..."
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => void createSubcategory()} disabled={addingSub || !newSubName.trim()}>
                  {addingSub ? "Adding..." : "Add Subcategory"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Official Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={form.known_name} onChange={(e) => setForm({ ...form, known_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-zinc-100"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as NomineeStatus })}
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Nominee Image</Label>
              <Input
                id="nominee-image-input"
                type="file"
                accept="image/*"
                className="cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setImageFile(file);
                }}
              />
            </div>
            <div className="md:col-span-2 pt-2">
              <Button type="submit" disabled={uploading !== null}>
                {uploading ? "Uploading image…" : "Create nominee"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nominees ({nominees.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((index) => (
                <div key={index} className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="h-5 w-48 rounded-full bg-zinc-800" />
                  <div className="mt-4 grid gap-2">
                    <div className="h-4 w-32 rounded-full bg-zinc-800" />
                    <div className="h-4 w-full rounded-full bg-zinc-800" />
                    <div className="h-4 w-2/3 rounded-full bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : nominees.length === 0 ? (
            <p className="text-sm text-zinc-500">No nominees in this filter.</p>
          ) : (
            nominees.map((n) => (
              <div key={n.id} className="rounded-lg border border-white/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-amber-50">
                        {n.known_name ? `${n.known_name} (${n.name})` : n.name}
                      </p>
                      <Badge variant={n.status === "approved" ? "default" : "secondary"}>{n.status}</Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {n.categories?.title}
                      {n.subcategories?.name ? ` · ${n.subcategories.name}` : ""} · <span suppressHydrationWarning>{voteCount(n)}</span> votes
                    </p>
                    {n.image_url ? (
                      <Image
                        src={n.image_url}
                        alt={n.name || "Nominee image"} // Provide meaningful alt text
                        width={48} // Corresponds to h-12 (48px)
                        height={48} // Corresponds to w-12 (48px)
                        className="mt-2 rounded-md object-cover" // Keep other styles, remove h-12 w-12
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {n.status !== "approved" ? (
                      <Button size="sm" onClick={() => void setStatus(n.id, "approved")}>
                        Approve
                      </Button>
                    ) : null}
                    {n.status !== "rejected" ? (
                      <Button size="sm" variant="outline" onClick={() => void setStatus(n.id, "rejected")}>
                        Reject
                      </Button>
                    ) : null}
                    <label className="inline-flex cursor-pointer items-center rounded-md border border-white/10 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-700">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading === n.id}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadImage(n.id, f);
                        }}
                      />
                      {uploading === n.id ? "Uploading…" : "Upload image"}
                    </label>
                    {isSuper ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingId === n.id}
                        onClick={() => void remove(n.id)}
                      >
                        {deletingId === n.id ? "Deleting..." : "Delete"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div >
  );
}
