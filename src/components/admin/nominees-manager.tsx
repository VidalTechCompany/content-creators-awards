"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Image from "next/image"; // Import the Image component
import { adminFetch } from "@/lib/admin/fetch";
import type { AdminRole, CategoryRow, NomineeRow, NomineeStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NomineeWithMeta = NomineeRow & {
  categories: { title: string; slug: string } | null;
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
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);
  const [nominees, setNominees] = useState<NomineeWithMeta[]>(initialNominees);
  const [filter, setFilter] = useState<NomineeStatus | "all">("all");
  const [loading, setLoading] = useState(initialNominees.length === 0);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({
    category_id: initialCategories[0]?.id || "",
    name: "",
    bio: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    status: "pending" as NomineeStatus,
  });

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
      setForm((f) => ({ ...f, category_id: f.category_id || cats.categories[0]?.id || "" }));
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
    try {
      await adminFetch("/api/admin/nominees", {
        method: "POST",
        body: JSON.stringify({
          category_id: form.category_id,
          name: form.name,
          bio: form.bio || null,
          status: form.status,
          social_links: {
            instagram: form.instagram || "",
            tiktok: form.tiktok || "",
            youtube: form.youtube || "",
          },
        }),
      });
      toast.success("Nominee created");
      setForm((f) => ({ ...f, name: "", bio: "", instagram: "", tiktok: "", youtube: "" }));
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
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

  async function uploadImage(nomineeId: string, file: File) {
    setUploading(nomineeId);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("nomineeId", nomineeId);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Upload failed");
      toast.success("Image uploaded");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function remove(id: string) {
    if (!isSuper || !confirm("Delete this nominee permanently?")) return;
    try {
      await adminFetch(`/api/admin/nominees/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function voteCount(n: NomineeWithMeta) {
    const s = n.nominee_stats;
    if (Array.isArray(s)) return s[0]?.vote_count ?? 0;
    return s?.vote_count ?? 0;
  }

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Add nominee</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={create}>
            <div className="space-y-2 md:col-span-2">
              <Label>Category</Label>
              <select
                className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-zinc-100"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
            <div className="space-y-2 md:col-span-2">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>TikTok URL</Label>
              <Input value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>YouTube URL</Label>
              <Input value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} />
            </div>
            <Button type="submit">Create nominee</Button>
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
                      <p className="text-sm font-medium text-amber-50">{n.name}</p>
                      <Badge variant={n.status === "approved" ? "default" : "secondary"}>{n.status}</Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {n.categories?.title} · {voteCount(n)} votes
                    </p>
                    {n.image_url ? (
                      <Image
                        src={n.image_url}
                        alt={n.name || "Nominee image"} // Provide meaningful alt text
                        width={48} // Corresponds to h-12 (48px)
                        height={48} // Corresponds to w-12 (48px)
                        className="mt-2 rounded-md object-cover" // Keep other styles, remove h-12 w-12
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
                      <Button size="sm" variant="destructive" onClick={() => void remove(n.id)}>
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
