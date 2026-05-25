import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 0;

export default async function AdminVotesPage() {
  const supabase = await createClient();
  const { count } = await supabase.from("votes").select("*", { count: "exact", head: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-amber-50">Votes</h1>
        <p className="mt-2 text-sm text-zinc-400">Export raw ballots for auditors ({(count ?? 0).toLocaleString()} rows).</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>CSV export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-zinc-400">
          <p>Downloads include identifiers only — join with nominees and categories inside your warehouse.</p>
          <Button asChild className="w-fit">
            <Link href="/api/admin/votes/export" prefetch={false}>
              Download votes.csv
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
