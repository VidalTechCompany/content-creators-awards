import type { Metadata } from "next";
import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = {
  title: "Update password",
  robots: { index: false, follow: false },
};

export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-16">
      <h1 className="font-serif text-3xl text-amber-50">Secure reset</h1>
      <UpdatePasswordForm />
    </div>
  );
}
