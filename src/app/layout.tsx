import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "@/app/globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { SessionProvider } from "@/components/providers/session-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { defaultMetadata } from "@/lib/seo";
import { createClientOrNull } from "@/lib/supabase/server";
import type { AdminRole } from "@/types/database";
import { getAdminRole } from "@/lib/admin/server";

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

export const metadata: Metadata = defaultMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClientOrNull();

  // Parallelize the session and admin check. 
  // getAdminRole is already cached via React.cache in lib/admin/server.ts
  const [sessionData, adminRole] = await Promise.all([
    supabase ? supabase.auth.getSession() : Promise.resolve({ data: { session: null } }),
    getAdminRole()
  ]);

  const session = sessionData.data.session;
  const email = session?.user?.email ?? null;
  const isAdmin = !!adminRole;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black font-sans text-zinc-100 antialiased`}
      >
        <AppProviders>
          <SessionProvider email={email} isAdmin={isAdmin} adminRole={adminRole}>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </div>
          </SessionProvider>
        </AppProviders>
      </body>
    </html>
  );
}
