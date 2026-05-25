import { SponsorsManager } from "@/components/admin/sponsors-manager";
import { getAdminRole } from "@/lib/admin/server";

export default async function AdminSponsorsPage() {
  const role = await getAdminRole();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-amber-50">Sponsors</h1>
        <p className="mt-2 text-sm text-zinc-400">Partners displayed on the home page.</p>
      </div>
      <SponsorsManager role={role} />
    </div>
  );
}
