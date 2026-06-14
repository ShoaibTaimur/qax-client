import { createFileRoute, Link } from "@tanstack/react-router";
import { InlineLoader } from "@/components/loading-screen";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderKanban,
  ListChecks,
  Bug as BugIcon,
  AlertOctagon,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — QAX" }] }),
  component: DashboardPage,
});

type Execution = {
  pass: number;
  fail: number;
  blocked: number;
  skipped: number;
  pending: number;
  otherFilled: number;
};

type PerProject = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  rowsTotal: number;
  execution: Execution;
  passRate: number;
  bugsTotal: number;
  openBugs: number;
  criticalOpen: number;
};

type Stats = {
  projectsTotal: number;
  projectsActive: number;
  rowsTotal: number;
  bugsTotal: number;
  openBugs: number;
  criticalOpen: number;
  execution: Execution;
  passRate: number;
  recentProjects: { id: string; name: string; status: string; createdAt: string }[];
  perProject: PerProject[];
};


function DashboardPage() {
  const { user } = useAuth();
  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: () => api<Stats>("/api/stats"),
  });
  const [selectedId, setSelectedId] = useState<string>("__all__");

  const s = stats.data;
  const selected =
    s && selectedId !== "__all__"
      ? s.perProject.find((p) => p.id === selectedId) ?? null
      : null;

  const view = selected
    ? {
        label: selected.name,
        execution: selected.execution,
        passRate: selected.passRate,
        rowsTotal: selected.rowsTotal,
        bugsTotal: selected.bugsTotal,
        openBugs: selected.openBugs,
        criticalOpen: selected.criticalOpen,
      }
    : s
      ? {
          label: "All projects",
          execution: s.execution,
          passRate: s.passRate,
          rowsTotal: s.rowsTotal,
          bugsTotal: s.bugsTotal,
          openBugs: s.openBugs,
          criticalOpen: s.criticalOpen,
        }
      : null;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-10">
      <header className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Overview
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Welcome back, {user?.username}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your QA workspace at a glance.
        </p>
      </header>

      {stats.isLoading || !s || !view ? (
        <InlineLoader />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              View
            </span>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="h-9 w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All projects</SelectItem>
                {s.perProject.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {view.label}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={selected ? "Project" : "Projects"}
              value={selected ? 1 : s.projectsTotal}
              hint={selected ? selected.status : `${s.projectsActive} active`}
              icon={FolderKanban}
            />
            <StatCard
              label="Test cases"
              value={view.rowsTotal}
              hint={selected ? "in this project" : "across all projects"}
              icon={ListChecks}
            />
            <StatCard
              label="Open bugs"
              value={view.openBugs}
              hint={`${view.bugsTotal} total`}
              icon={BugIcon}
              tone={view.openBugs > 0 ? "warning" : "default"}
            />
            <StatCard
              label="Critical open"
              value={view.criticalOpen}
              hint="high-severity"
              icon={AlertOctagon}
              tone={view.criticalOpen > 0 ? "destructive" : "default"}
            />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Execution · {view.label}
                </h2>
                <div className="text-right">
                  <div className="text-3xl font-semibold tracking-tight">
                    {Math.round(view.passRate * 100)}%
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Pass rate
                  </div>
                </div>
              </div>
              <PassRateBar exec={view.execution} />
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
                <ExecStat label="Pass" value={view.execution.pass} dot="bg-success" />
                <ExecStat label="Fail" value={view.execution.fail} dot="bg-destructive" />
                <ExecStat label="Blocked" value={view.execution.blocked} dot="bg-warning" />
                <ExecStat label="Skipped" value={view.execution.skipped} dot="bg-muted-foreground" />
                <ExecStat label="Pending" value={view.execution.pending} dot="bg-info" />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Recent projects
                </h2>
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {s.recentProjects.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No projects yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {s.recentProjects.map((p) => (
                    <li key={p.id}>
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: p.id }}
                        className="flex items-center justify-between py-2.5 text-sm hover:text-primary"
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {!selected && s.perProject.length > 0 && (
            <div className="mt-8 rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Per-project breakdown
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-3">Project</th>
                      <th className="px-3 py-2 text-right">Cases</th>
                      <th className="px-3 py-2 text-right">Pass</th>
                      <th className="px-3 py-2 text-right">Fail</th>
                      <th className="px-3 py-2 text-right">Blocked</th>
                      <th className="px-3 py-2 text-right">Skipped</th>
                      <th className="px-3 py-2 text-right">Pending</th>
                      <th className="px-3 py-2 text-right">Open bugs</th>
                      <th className="px-3 py-2 text-right">Pass rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {s.perProject.map((p) => (
                      <tr key={p.id} className="hover:bg-accent/30">
                        <td className="py-2 pr-3">
                          <button
                            onClick={() => setSelectedId(p.id)}
                            className="truncate text-left hover:text-primary"
                          >
                            {p.name}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{p.rowsTotal}</td>
                        <td className="px-3 py-2 text-right font-mono text-success">{p.execution.pass}</td>
                        <td className="px-3 py-2 text-right font-mono text-destructive">{p.execution.fail}</td>
                        <td className="px-3 py-2 text-right font-mono text-warning">{p.execution.blocked}</td>
                        <td className="px-3 py-2 text-right font-mono">{p.execution.skipped}</td>
                        <td className="px-3 py-2 text-right font-mono text-info">{p.execution.pending}</td>
                        <td className="px-3 py-2 text-right font-mono">{p.openBugs}</td>
                        <td className="px-3 py-2 text-right font-mono">{Math.round(p.passRate * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warning" | "destructive";
}) {
  const toneCls =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={`mt-3 text-3xl font-semibold tracking-tight ${toneCls}`}>
        {value}
      </div>
      {hint && (
        <div className="mt-1 font-mono text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

function ExecStat({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <div>
        <div className="text-sm font-medium">{value}</div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

function PassRateBar({ exec }: { exec: Stats["execution"] }) {
  const total =
    exec.pass + exec.fail + exec.blocked + exec.skipped + exec.pending + exec.otherFilled;
  if (total === 0) {
    return (
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-full" />
      </div>
    );
  }
  const pct = (n: number) => (n / total) * 100;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-success" style={{ width: `${pct(exec.pass)}%` }} />
      <div className="h-full bg-destructive" style={{ width: `${pct(exec.fail)}%` }} />
      <div className="h-full bg-warning" style={{ width: `${pct(exec.blocked)}%` }} />
      <div className="h-full bg-muted-foreground/40" style={{ width: `${pct(exec.skipped)}%` }} />
      <div className="h-full bg-info" style={{ width: `${pct(exec.pending)}%` }} />
    </div>
  );
}
