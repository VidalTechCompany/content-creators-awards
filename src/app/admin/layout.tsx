import { redirect } from "next/navigation";
import { AdminShell } from "./admin-shell";
import type { AdminRole } from "@/types/database";
import { getAdminRole } from "@/lib/admin/server";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const role = await getAdminRole();

  if (!role) {
    redirect("/auth/login?next=/admin");
  }

  /**
   * Cast as AdminRole to satisfy the AdminShell prop requirements.
   * The redirect check above ensures that 'role' is non-null at this point.
   */
  return <AdminShell role={role as AdminRole}>{children}</AdminShell>;
}