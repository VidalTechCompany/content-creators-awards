import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 0;

export default async function AdminSuspiciousPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("suspicious_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-amber-50">Suspicious activity</h1>
        <p className="mt-2 text-sm text-zinc-400">Automated signals from the voting API.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent rows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-300">
          {(rows ?? []).length ? (
            (rows ?? []).map((r) => (
              <div key={r.id} className="rounded-lg border border-white/10 bg-black/40 p-3">
                <p className="text-xs text-zinc-500">{new Date(r.created_at).toLocaleString()}</p>
                <p className="font-medium text-amber-100">{r.reason}</p>
                <pre className="mt-2 overflow-x-auto text-xs text-zinc-500">
                  {JSON.stringify(r.meta, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <p className="text-zinc-500">No suspicious rows yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
