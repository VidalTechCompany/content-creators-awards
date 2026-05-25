import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResendVerificationButton } from "./resend-button";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/auth/account");

  const { data: adminRow } = await supabase
    .from("admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (adminRow) redirect("/admin");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-16">
      <h1 className="font-serif text-3xl text-amber-50">Your account</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Email verification is required for voting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-300">
          <p>
            <span className="text-zinc-500">Email:</span> {user.email}
          </p>
          <p>
            <span className="text-zinc-500">Verified:</span>{" "}
            {user.email_confirmed_at ? "Yes" : "Pending — check your inbox"}
          </p>
          {!user.email_confirmed_at ? <ResendVerificationButton /> : null}
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}
