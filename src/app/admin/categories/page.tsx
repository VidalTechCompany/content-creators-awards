import { CategoriesManager } from "@/components/admin/categories-manager";
import { getAdminRole } from "@/lib/admin/server";
import { redirect } from "next/navigation";

export default async function AdminCategoriesPage() {
  const role = await getAdminRole();
  if (!role) redirect("/auth/login?next=/admin"); // Defensive check, AdminLayout should handle this
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-amber-50">Categories</h1>
        <p className="mt-2 text-sm text-zinc-400">Manage award sections shown on the public site.</p>
      </div>
      <CategoriesManager role={role} />
    </div>
  );
}
