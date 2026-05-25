import { redirect } from "next/navigation";
import { AdminShell } from "./admin-shell";
import type { AdminRole } from "@/types/database";
import { getAdminRole } from "@/lib/admin/server"; // 1. Uncommented this so it can be executed below

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const role = await getAdminRole();

  // If getAdminRole returns null, it means either no user or user is not an admin.
  // Redirect to login if no role is found.
  if (!role) {
    redirect("/auth/login?next=/admin");
  }

  // Cast the role explicitly as AdminRole so TypeScript satisfies your AdminShell prop type
  return <AdminShell role={role as AdminRole}>{children}</AdminShell>;
}