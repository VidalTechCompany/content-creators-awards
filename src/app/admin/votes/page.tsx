import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const revalidate = 0;

export default async function AdminVotesPage() {
  const supabase = await createClient();

  // Fetch total vote count
  const { count } = await supabase.from("votes").select("*", { count: "exact", head: true });

  // Fetch nominees with their vote counts, joined with category title
  const { data: leaderboard } = await supabase
    .from("nominees")
    .select(`
      id,
      name,
      known_name,
      status,
      categories (title),
      nominee_stats (vote_count)
    `)
    .order("vote_count", { foreignTable: "nominee_stats", ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-amber-50">Votes</h1>
        <p className="mt-2 text-sm text-zinc-400" suppressHydrationWarning>
          Export raw ballots for auditors ({(count ?? 0).toLocaleString()} rows).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vote Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Nominee</TableHead>
                  <TableHead className="min-w-[140px]">Category</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right w-[120px]">Total Votes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard?.map((item) => {
                  // Handle Supabase returning joined stats as an array
                  const statsData = Array.isArray(item.nominee_stats) ? item.nominee_stats[0] : item.nominee_stats;
                  const stats = statsData as unknown as { vote_count: number } | null;
                  const categoryData = Array.isArray(item.categories) ? item.categories[0] : item.categories;
                  const category = categoryData as unknown as { title: string } | null;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-amber-50">
                        {item.known_name || item.name}
                        {item.known_name && <span className="ml-2 block text-[10px] text-zinc-500 sm:inline sm:text-xs">({item.name})</span>}
                      </TableCell>
                      <TableCell className="text-zinc-400">{category?.title || "N/A"}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${item.status === 'approved' ? 'text-emerald-500' :
                          item.status === 'pending' ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-amber-200" suppressHydrationWarning>
                        {(stats?.vote_count ?? 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!leaderboard || leaderboard.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                      No voting data available yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-400">
          <p>Download the latest voting data for auditing and reporting purposes.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/api/admin/votes/export" prefetch={false}>
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/api/admin/votes/export?format=xlsx" prefetch={false}>
                <FileDown className="mr-2 h-4 w-4" />
                Export Excel
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
