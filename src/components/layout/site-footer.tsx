import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/80 py-12 text-sm text-zinc-400">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3">
        <div>
          <p className="font-serif text-lg text-amber-100">{APP_NAME}</p>
          <p className="mt-2 max-w-xs">
            Secure public voting with verified accounts, audit trails, and realtime results.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-zinc-500">Legal</span>
          <Link href="/terms" className="hover:text-amber-200">
            Terms &amp; Conditions
          </Link>
          <Link href="/privacy" className="hover:text-amber-200">
            Privacy Policy
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-zinc-500">Connect</span>
          <Link href="/contact" className="hover:text-amber-200">
            Contact
          </Link>
          <Link href="/faq" className="hover:text-amber-200">
            FAQ
          </Link>
        </div>
      </div>
      <p className="mt-10 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} {APP_NAME}. Crafted for creators.
      </p>
    </footer>
  );
}
