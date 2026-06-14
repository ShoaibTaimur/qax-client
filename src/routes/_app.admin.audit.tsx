import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/admin/audit")({
  head: () => ({ meta: [{ title: "Audit log — QAX Admin" }] }),
  component: AuditLogPage,
});

type AuditEntry = {
  id: string;
  userId: string | null;
  username: string;
  action: string;
  meta: Record<string, unknown>;
  createdAt: string;
};

function AuditLogPage() {
  const logs = useQuery({
    queryKey: ["audit"],
    queryFn: () => api<AuditEntry[]>("/api/audit?limit=200"),
  });

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <header className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Admin</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Most recent 200 system actions.</p>
      </header>
      {logs.isLoading ? (
        <div className="font-mono text-xs text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["Time", "User", "Action", "Details"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.data?.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {new Date(l.createdAt).toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td className="px-3 py-2 font-medium">{l.username}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                      {l.action}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {l.meta && Object.keys(l.meta).length > 0
                      ? JSON.stringify(l.meta)
                      : "—"}
                  </td>
                </tr>
              ))}
              {logs.data?.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">No activity yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
