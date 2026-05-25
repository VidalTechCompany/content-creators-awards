"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/components/providers/session-provider";

export function HeaderAuth() {
  const { email, isAdmin } = useSession();

  async function signOut() {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/";
  }

  if (!email) {
    return (
      <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
        <Link href="/auth/login">Log in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Button asChild size="sm" className="hidden sm:inline-flex bg-amber-600 hover:bg-amber-700">
          <Link href="/admin" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Admin Dashboard
          </Link>
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="hidden md:inline-flex">
            Account
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="border-white/10 bg-zinc-950 text-zinc-100">
          {isAdmin && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/admin">Admin Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/auth/account">Profile</Link>
              </DropdownMenuItem>
            </>
          )}
          {!isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/auth/account">Profile</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              void signOut();
            }}
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
