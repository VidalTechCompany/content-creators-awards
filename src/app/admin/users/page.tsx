import { UsersManager } from "@/components/admin/users-manager";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-amber-50">Users</h1>
        <p className="mt-2 text-sm text-zinc-400">Registered accounts and vote activity.</p>
      </div>
      <UsersManager />
    </div>
  );
}
