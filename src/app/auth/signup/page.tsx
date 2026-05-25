import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-16">
      <div>
        <h1 className="font-serif text-3xl text-amber-50">Join the academy</h1>
        <p className="mt-2 text-sm text-zinc-400">Verification keeps the leaderboard authentic.</p>
      </div>
      <SignupForm />
    </div>
  );
}
