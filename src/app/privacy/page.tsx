import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl py-12 text-sm leading-relaxed text-zinc-300">
      <h1 className="font-serif text-4xl text-amber-50">Privacy Policy</h1>
      <p className="mt-4 text-zinc-400">
        This placeholder explains the categories of data processed by the voting platform. Replace with a
        jurisdiction-specific policy.
      </p>
      <ul className="mt-8 list-disc space-y-3 pl-6">
        <li>Account data is processed by Supabase Auth (email, password hash, session metadata).</li>
        <li>Voting telemetry may include IP address, user agent, and a browser fingerprint token.</li>
        <li>Audit logs retain administrative actions for security investigations.</li>
        <li>Data retention windows should be configured to meet your compliance obligations.</li>
      </ul>
    </div>
  );
}
