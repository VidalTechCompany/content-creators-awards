"use client";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  async function signOut() {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={signOut}>
      Log out
    </Button>
  );
}
