import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-16">
      <h1 className="font-serif text-3xl text-amber-50">Forgot password</h1>
      <ForgotPasswordForm />
    </div>
  );
}
