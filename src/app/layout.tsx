import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { SessionProvider } from "@/components/providers/session-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { defaultMetadata } from "@/lib/seo";
import { createClientOrNull } from "@/lib/supabase/server";
import { getAdminRole } from "@/lib/admin/server";
import { type UserResponse } from "@supabase/supabase-js";
import TurnstileRoot from "@/components/turnstile/turnstile-root";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

// Clean up site base URL mapping
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://molocontentcreatorsawards.co.ke";

// Merging default SEO structures with explicitly declared root configs
export const metadata: Metadata = {
  ...defaultMetadata,
  metadataBase: new URL(baseUrl),
  title: {
    default: "Molo Content Creators Awards",
    template: "%s | Molo Content Creators Awards",
  },
  description: "Cast your vote and support your favorite digital creators, artists, and media personalities in the Molo Content Creators Awards.",
  keywords: ["Molo Awards", "Content Creators Awards", "Voting Engine", "Molo Kenya", "Digital Creators"],
  authors: [{ name: "Vidal Tech Company" }],
  openGraph: {
    title: "Molo Content Creators Awards",
    description: "Cast your vote and support your favorite digital creators!",
    url: baseUrl,
    siteName: "Molo Content Creators Awards",
    images: [
      {
        url: "/og-image.png", // Ensure you have a nice preview image placed in your public/ folder
        width: 1200,
        height: 630,
        alt: "Molo Content Creators Awards Banner",
      },
    ],
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Molo Content Creators Awards",
    description: "Cast your vote and support your favorite digital creators!",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClientOrNull();

  // Parallelize the user and admin check. getUser authenticates the token with Supabase Auth.
  const [userResult, adminResult] = await Promise.allSettled([
    supabase ? supabase.auth.getUser() : Promise.resolve({ data: { user: null }, error: null }),
    getAdminRole(),
  ]);

  const user = userResult.status === "fulfilled" ? (userResult.value as UserResponse).data?.user ?? null : null;
  const adminRole = adminResult.status === "fulfilled" ? adminResult.value : null;

  const email = user?.email ?? null;
  const isAdmin = !!adminRole;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black font-sans text-zinc-100 antialiased`}
      >
        <TurnstileRoot />
        <AppProviders>
          <SessionProvider email={email} isAdmin={isAdmin} adminRole={adminRole}>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1 w-full overflow-hidden">
                {children}
              </main>
              <SiteFooter />
            </div>
          </SessionProvider>
        </AppProviders>
      </body>
    </html>
  );
}