import { redirect } from "next/navigation";
import { AdminShell } from "./admin-shell";
import type { AdminRole } from "@/types/database";
import { getAdminRole } from "@/lib/admin/server"; // Import the cached function

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getAdminRole(); // Use the cached function

  // If getAdminRole returns null, it means either no user or user is not an admin.
  // Redirect to login if no role is found.
  if (!role) redirect("/auth/login?next=/admin");

  return <AdminShell role={role}>{children}</AdminShell>;
}
