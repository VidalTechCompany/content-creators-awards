import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl py-12 text-sm leading-relaxed text-zinc-300">
      <h1 className="font-serif text-4xl text-amber-50">Terms &amp; Conditions</h1>
      <p className="mt-4 text-zinc-400">
        These terms are a starter template for your legal team. Replace with counsel-approved language before
        production launch.
      </p>
      <ol className="mt-8 list-decimal space-y-4 pl-6">
        <li>Eligibility, residency requirements, and age gates are defined by the event producer.</li>
        <li>Votes deemed fraudulent may be voided; associated accounts may be suspended.</li>
        <li>Trademarks referenced on this site belong to their respective owners.</li>
        <li>The platform is provided “as is” without warranties; limit liability to the maximum extent permitted by law.</li>
      </ol>
    </div>
  );
}
