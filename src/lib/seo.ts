import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Celebrate excellence in digital storytelling. Vote for your favorite creators across TikTok, YouTube, Instagram, and more.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site,
    siteName: APP_NAME,
    title: APP_NAME,
    description:
      "Public voting for the Molo ni Nyumbani Award — secure, verified, and transparent.",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: "Vote for outstanding creators. Secure authentication and anti-fraud protections.",
  },
  robots: { index: true, follow: true },
};
