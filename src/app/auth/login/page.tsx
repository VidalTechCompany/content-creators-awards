import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-16">
      <div>
        <h1 className="font-serif text-3xl text-amber-50">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-400">Use the email and password you registered with.</p>
      </div>
      <Suspense fallback={<div className="text-sm text-zinc-500">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
