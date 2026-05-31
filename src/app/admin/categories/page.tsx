'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/fetch';
import { Plus, X, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Category {
  id: string;
  title: string;
  slug: string;
  section: string;
  description: string | null;
  sort_order: number;
  status: string;
  nomineeCount: number;
  approvedNomineeCount: number;
  subcategories?: { id: string; name: string }[];
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [subForms, setSubForms] = useState<Record<string, string>>({});
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({
    title: '',
    slug: '',
    section: 'General',
    description: '',
  });
  const [selectedSection, setSelectedSection] = useState<string>("");

  useEffect(() => {
    fetchCategories();
  }, [selectedSection]);

  const fetchCategories = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const url = selectedSection
        ? `/api/admin/categories?section=${encodeURIComponent(selectedSection)}&includeInactive=true`
        : '/api/admin/categories?includeInactive=true';

      const data = await adminFetch<{ categories: Category[] }>(url);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setNewCategory(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await adminFetch<{ category?: { id: string } }>('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(newCategory),
      });

      const categoryId = res?.category?.id;

      // Pro Implementation: Parallel subcategory creation for TikTok Dancers
      if (categoryId && newCategory.title.toLowerCase().includes('tiktok dancers')) {
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
        toast.success('Category created with Best Male/Female subcategories');
      } else {
        toast.success('Category created successfully');
      }

      setIsCreating(false);
      setNewCategory({ title: '', slug: '', section: 'General', description: '' });
      fetchCategories(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubcategory = async (categoryId: string) => {
    const name = subForms[categoryId];
    if (!name?.trim()) return;

    try {
      setAddingSubTo(categoryId);
      await adminFetch('/api/admin/subcategories', {
        method: 'POST',
        body: JSON.stringify({
          category_id: categoryId,
          name: name.trim(),
          slug: generateSlug(name),
        }),
      });
      toast.success('Subcategory added');
      setSubForms(prev => ({ ...prev, [categoryId]: '' }));
      fetchCategories(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add subcategory');
    } finally {
      setAddingSubTo(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its nominees?')) return;
    setDeletingId(id);
    try {
      await adminFetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      toast.success('Category deleted');
      fetchCategories(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteSubcategory = async (subId: string) => {
    if (!confirm('Delete this subcategory?')) return;
    try {
      await adminFetch(`/api/admin/subcategories?id=${subId}`, { method: 'DELETE' });
      toast.success('Subcategory deleted');
      fetchCategories(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500 text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Button onClick={() => setIsCreating(!isCreating)} variant={isCreating ? "ghost" : "default"}>
          {isCreating ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {isCreating ? 'Cancel' : 'Add Category'}
        </Button>
      </div>

      {/* Create Category Form */}
      {isCreating && (
        <div className="mb-8 p-6 border rounded-lg bg-gray-50 shadow-sm transition-all">
          <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
          <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Title</label>
              <input
                type="text"
                value={newCategory.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Breakout Creator of the Year"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Slug</label>
              <input
                type="text"
                value={newCategory.slug}
                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="breakout-creator-of-the-year"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Section</label>
              <select
                value={newCategory.section}
                onChange={(e) => setNewCategory({ ...newCategory, section: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="General">General</option>
                <option value="Technical">Technical</option>
                <option value="Creative">Creative</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Optional description for voters"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Category
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Section Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">Filter List:</label>
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">All Sections</option>
          <option value="General">General</option>
          <option value="Technical">Technical</option>
          <option value="Creative">Creative</option>
        </select>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No categories found</p>
          {!isCreating && (
            <Button variant="outline" className="mt-4" onClick={() => setIsCreating(true)}>
              Create your first category
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="flex flex-col border rounded-lg p-6 shadow-sm hover:shadow-md transition-all bg-white">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold">{category.title}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteCategory(category.id)}
                  disabled={deletingId === category.id}
                >
                  {deletingId === category.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>

              {category.description && (
                <p className="text-gray-500 mb-4 text-sm line-clamp-2 italic">{category.description}</p>
              )}

              <div className="flex-1 space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-2">Subcategories</label>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {category.subcategories && category.subcategories.length > 0 ? (
                      category.subcategories.map((sub) => (
                        <span key={sub.id} className="inline-flex items-center bg-white border px-2 py-0.5 rounded text-[10px] text-gray-600 group">
                          {sub.name}
                          <button
                            onClick={() => handleDeleteSubcategory(sub.id)}
                            className="ml-1 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">No subcategories</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Add sub..."
                      className="flex-1 text-[10px] px-2 py-1 rounded border outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                      value={subForms[category.id] || ''}
                      onChange={(e) => setSubForms({ ...subForms, [category.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateSubcategory(category.id)}
                    />
                    <Button
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCreateSubcategory(category.id)}
                      disabled={addingSubTo === category.id}
                    >
                      {addingSubTo === category.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t">
                  <span className="text-gray-400">{category.section}</span>
                  <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                    {category.approvedNomineeCount || 0} Nominees
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {categories.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">
            Total Categories: <span className="font-bold">{categories.length}</span>
          </p>
        </div>
      )}
    </div>
  );
}