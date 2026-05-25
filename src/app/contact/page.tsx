import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the Molo ni Nyumbani Award team.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl py-12">
      <h1 className="font-serif text-4xl text-amber-50">Contact</h1>
      <p className="mt-3 text-sm text-zinc-400">
        For partnerships and press inquiries, send a message. This demo opens your mail client — replace with
        Resend or a Supabase Edge Function for production delivery.
      </p>
      <ContactForm />
    </div>
  );
}
