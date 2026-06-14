import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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

type Stats = {
  projectsTotal: number;
  projectsActive: number;
  rowsTotal: number;
  bugsTotal: number;
  openBugs: number;
  criticalOpen: number;
  execution: {
    pass: number;
    fail: number;
    blocked: number;
    skipped: number;
    pending: number;
    otherFilled: number;
  };
  passRate: number;
  recentProjects: { id: string; name: string; status: string; createdAt: string }[];
};

function DashboardPage() {
  const { user } = useAuth();
  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: () => api<Stats>("/api/stats"),
  });

  const s = stats.data;

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

      {stats.isLoading || !s ? (
        <div className="font-mono text-xs text-muted-foreground">Loading…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Projects"
              value={s.projectsTotal}
              hint={`${s.projectsActive} active`}
              icon={FolderKanban}
            />
            <StatCard
              label="Test cases"
              value={s.rowsTotal}
              hint="across all projects"
              icon={ListChecks}
            />
            <StatCard
              label="Open bugs"
              value={s.openBugs}
              hint={`${s.bugsTotal} total`}
              icon={BugIcon}
              tone={s.openBugs > 0 ? "warning" : "default"}
            />
            <StatCard
              label="Critical open"
              value={s.criticalOpen}
              hint="high-severity"
              icon={AlertOctagon}
              tone={s.criticalOpen > 0 ? "destructive" : "default"}
            />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Execution
                </h2>
                <div className="text-right">
                  <div className="text-3xl font-semibold tracking-tight">
                    {Math.round(s.passRate * 100)}%
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Pass rate
                  </div>
                </div>
              </div>
              <PassRateBar exec={s.execution} />
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
                <ExecStat label="Pass" value={s.execution.pass} dot="bg-success" />
                <ExecStat label="Fail" value={s.execution.fail} dot="bg-destructive" />
                <ExecStat label="Blocked" value={s.execution.blocked} dot="bg-warning" />
                <ExecStat label="Skipped" value={s.execution.skipped} dot="bg-muted-foreground" />
                <ExecStat label="Pending" value={s.execution.pending} dot="bg-info" />
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
