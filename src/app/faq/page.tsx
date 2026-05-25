import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about voting, accounts, and security.",
};

const items = [
  {
    q: "Why do I need a verified email to vote?",
    a: "Verification proves you control the inbox tied to your account, which dramatically reduces automated abuse and duplicate identities.",
  },
  {
    q: "How many times can I vote?",
    a: "You may cast one vote per award category. Changing your vote is not supported — choose carefully.",
  },
  {
    q: "What data is stored with my vote?",
    a: "We store a tamper-resistant audit record including IP address, browser fingerprint hash, and user agent to detect suspicious patterns.",
  },
  {
    q: "How are ties broken?",
    a: "Operational tie-break rules are configured by the awards committee and can be adjusted in admin settings.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl py-12">
      <h1 className="font-serif text-4xl text-amber-50">FAQ</h1>
      <div className="mt-8 space-y-6">
        {items.map((item) => (
          <div key={item.q} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <h2 className="font-medium text-amber-100">{item.q}</h2>
            <p className="mt-2 text-sm text-zinc-400">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
