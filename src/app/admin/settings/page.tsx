import { createClient } from "@/lib/supabase/server";
import { SiteSettingsForm } from "./site-settings-form";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-amber-50">Site settings</h1>
        <p className="mt-2 text-sm text-zinc-400">Controls the public countdown and voting availability flag.</p>
      </div>
      <SiteSettingsForm
        initial={{
          voting_open: data?.voting_open ?? true,
          voting_deadline: data?.voting_deadline ?? null,
        }}
      />
    </div>
  );
}
