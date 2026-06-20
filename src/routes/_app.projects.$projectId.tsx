import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api, ApiError, downloadUrl, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  FileSpreadsheet,
  FileText,
  Bug as BugIcon,
  Search,
  Paperclip,
  Upload,
  X,
  Eye,
  Image as ImageIcon,
  File as FileIcon,
  Film,

} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/projects/$projectId")({
  head: () => ({ meta: [{ title: "Project — QAX" }] }),
  component: ProjectPage,
});

type Project = {
  id: string;
  name: string;
  clientName: string;
  description: string;
  status: string;
};

const COLUMN_TYPES = [
  "text",
  "longText",
  "number",
  "date",
  "dropdown",
  "status",
  "severity",
  "priority",
  "link",
  "checkbox",
] as const;
type ColumnType = (typeof COLUMN_TYPES)[number];

type Column = {
  id: string;
  label: string;
  type: ColumnType;
  order: number;
  width: number;
  options?: string[];
};

type Row = {
  id: string;
  order: number;
  cells: Record<string, unknown>;
};

type Attachment = {
  id: string;
  secureUrl: string;
  resourceType: "image" | "video" | "raw";
  fileName: string;
  fileType: string;
  fileSize: number;
};

type Bug = {
  id: string;
  bugId: string;
  title: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  priority: "P1" | "P2" | "P3" | "P4";
  status: "Open" | "In Progress" | "Resolved" | "Closed" | "Wont Fix";
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  attachments: Attachment[];
  createdAt: string;
};

const STATUS_PRESETS = ["Pass", "Fail", "Blocked", "Skipped", "Pending"] as const;
const SEVERITY_PRESETS = ["Low", "Medium", "High", "Critical"] as const;
const PRIORITY_PRESETS = ["P1", "P2", "P3", "P4"] as const;

function statusClass(value: string) {
  const v = value.toLowerCase();
  if (v === "pass" || v === "resolved" || v === "closed")
    return "bg-success/15 text-success border-success/30";
  if (v === "fail" || v === "critical" || v === "p1")
    return "bg-destructive/15 text-destructive border-destructive/30";
  if (v === "blocked" || v === "high" || v === "p2" || v === "in progress")
    return "bg-warning/15 text-warning border-warning/40";
  if (v === "skipped" || v === "wont fix")
    return "bg-muted text-muted-foreground border-border";
  return "bg-info/15 text-info border-info/30";
}

function ProjectPage() {
  const { projectId } = Route.useParams();
  const qc = useQueryClient();

  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api<Project>(`/api/projects/${projectId}`),
  });

  if (project.isLoading) {
    return (
      <div className="p-10 font-mono text-xs text-muted-foreground">Loading project…</div>
    );
  }
  if (project.isError || !project.data) {
    return (
      <div className="p-10">
        <Link to="/projects" className="text-sm text-primary hover:underline">
          ← Back to projects
        </Link>
        <p className="mt-4 text-destructive">
          {(project.error as ApiError | undefined)?.message ?? "Failed to load project."}
        </p>
      </div>
    );
  }

  const p = project.data;

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <header className="border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> All projects
            </Link>
            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {p.name}
            </h1>
            {(p.clientName || p.description) && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {p.clientName && (
                  <span className="font-mono uppercase tracking-wider">{p.clientName}</span>
                )}
                {p.clientName && p.description && <span className="mx-2">·</span>}
                {p.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href={downloadUrl(`/api/projects/${projectId}/export.xlsx`)}
                onClick={(e) =>
                  downloadWithAuth(e, `/api/projects/${projectId}/export.xlsx`, `${p.name}.xlsx`)
                }
              >
                <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Excel</span>
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={downloadUrl(`/api/projects/${projectId}/export.pdf`)}
                onClick={(e) =>
                  downloadWithAuth(e, `/api/projects/${projectId}/export.pdf`, `${p.name}.pdf`)
                }
              >
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">PDF</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="table" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border bg-card px-6">
          <TabsList className="h-auto gap-1 bg-transparent p-0">
            <TabsTrigger value="table" className="data-[state=active]:bg-accent">Test Cases</TabsTrigger>
            <TabsTrigger value="bugs" className="data-[state=active]:bg-accent">Bugs</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="table" className="flex-1 overflow-hidden m-0 p-0">
          <TableView projectId={projectId} />
        </TabsContent>
        <TabsContent value="bugs" className="flex-1 overflow-auto m-0 p-0">
          <BugsView projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );

  function downloadWithAuth(e: React.MouseEvent, path: string, filename: string) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    fetch(downloadUrl(path), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Export failed (${r.status})`);
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((err) => toast.error(err.message));
  }
}

/* ----------------------------- Table view ----------------------------- */

function TableView({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);

  const columns = useQuery({
    queryKey: ["columns", projectId],
    queryFn: () => api<Column[]>(`/api/projects/${projectId}/columns`),
  });
  const rows = useQuery({
    queryKey: ["rows", projectId],
    queryFn: () => api<Row[]>(`/api/projects/${projectId}/rows`),
  });

  const addRow = useMutation({
    mutationFn: () =>
      api<Row>(`/api/projects/${projectId}/rows`, { method: "POST", json: { cells: {} } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rows", projectId] }),
    onError: (e: ApiError) => toast.error(e.message),
  });

  const deleteRows = useMutation({
    mutationFn: (ids: string[]) =>
      api(`/api/projects/${projectId}/rows`, { method: "DELETE", json: { ids } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rows", projectId] });
      toast.success("Rows deleted");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  const deleteColumn = useMutation({
    mutationFn: (id: string) =>
      api(`/api/projects/${projectId}/columns/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["columns", projectId] });
      qc.invalidateQueries({ queryKey: ["rows", projectId] });
      toast.success("Column deleted");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  const renameColumn = useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) =>
      api(`/api/projects/${projectId}/columns/${id}`, {
        method: "PATCH",
        json: { label },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["columns", projectId] });
      toast.success("Column renamed");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });


  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleSelected = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const filteredRows = useMemo(() => {
    if (!rows.data) return [];
    if (!filter.trim()) return rows.data;
    const q = filter.toLowerCase();
    return rows.data.filter((r) =>
      Object.values(r.cells ?? {}).some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  }, [rows.data, filter]);

  if (columns.isLoading || rows.isLoading) {
    return <div className="p-6 font-mono text-xs text-muted-foreground">Loading table…</div>;
  }

  const cols = columns.data ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter rows…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 font-mono text-sm"
          />
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm(`Delete ${selected.size} row(s)?`)) {
                  deleteRows.mutate(Array.from(selected));
                  setSelected(new Set());
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete ({selected.size})
            </Button>
          )}
          <Dialog open={addingColumn} onOpenChange={setAddingColumn}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Column
              </Button>
            </DialogTrigger>
            <AddColumnDialog
              projectId={projectId}
              onClose={() => setAddingColumn(false)}
            />
          </Dialog>
          <Button size="sm" onClick={() => addRow.mutate()}>
            <Plus className="mr-2 h-4 w-4" /> Row
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {cols.length === 0 ? (
          <div className="m-6 rounded-lg border border-dashed border-border bg-card p-12 text-center">
            <h3 className="text-lg font-semibold">No columns yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a column to start building your test case table.
            </p>
            <Button className="mt-4" onClick={() => setAddingColumn(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add column
            </Button>
          </div>
        ) : (
          <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="sticky left-0 z-20 w-10 border-b border-r border-border bg-muted px-2 py-2"></th>
                {cols.map((c) => (
                  <th
                    key={c.id}
                    style={{ width: c.width, minWidth: c.width }}
                    className="group border-b border-r border-border bg-muted px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-foreground">{c.label}</span>
                      <span className="text-[10px] text-muted-foreground">{c.type}</span>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => {
                            const next = prompt(`Rename column "${c.label}"`, c.label);
                            const trimmed = next?.trim();
                            if (trimmed && trimmed !== c.label) {
                              renameColumn.mutate({ id: c.id, label: trimmed });
                            }
                          }}
                          className="hover:text-primary"
                          title="Rename column"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete column "${c.label}"?`)) deleteColumn.mutate(c.id);
                          }}
                          className="hover:text-destructive"
                          title="Delete column"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                  </th>
                ))}
                <th className="border-b border-border bg-muted px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => (
                <TableRow
                  key={r.id}
                  row={r}
                  index={i}
                  columns={cols}
                  projectId={projectId}
                  selected={selected.has(r.id)}
                  onToggle={() => toggleSelected(r.id)}
                />
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 2} className="border-b border-border p-6 text-center text-sm text-muted-foreground">
                    {filter ? "No matching rows." : "No rows yet. Click + Row to add one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TableRow({
  row,
  index,
  columns,
  projectId,
  selected,
  onToggle,
}: {
  row: Row;
  index: number;
  columns: Column[];
  projectId: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: (cells: Record<string, unknown>) =>
      api(`/api/projects/${projectId}/rows/${row.id}`, {
        method: "PATCH",
        json: { cells },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rows", projectId] }),
    onError: (e: ApiError) => toast.error(e.message),
  });

  return (
    <tr className={cn("group", selected && "bg-accent/40")}>
      <td className="sticky left-0 z-10 w-10 border-b border-r border-border bg-card px-2 py-1 text-center align-middle">
        <div className="flex items-center justify-center gap-1">
          <span className="font-mono text-[10px] text-muted-foreground">{index + 1}</span>
        </div>
        <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-1" />
      </td>
      {columns.map((c) => (
        <td
          key={c.id}
          style={{ width: c.width, minWidth: c.width }}
          className="border-b border-r border-border bg-card p-0 align-top"
        >
          <CellEditor
            column={c}
            value={row.cells?.[c.id]}
            onChange={(v) => update.mutate({ [c.id]: v })}
          />
        </td>
      ))}
      <td className="border-b border-border bg-card"></td>
    </tr>
  );
}

function CellEditor({
  column,
  value,
  onChange,
}: {
  column: Column;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const presets =
    column.type === "status"
      ? STATUS_PRESETS
      : column.type === "severity"
        ? SEVERITY_PRESETS
        : column.type === "priority"
          ? PRIORITY_PRESETS
          : column.type === "dropdown"
            ? column.options ?? []
            : null;

  if (presets) {
    const v = (value as string) ?? "";
    return (
      <Select value={v || "__none__"} onValueChange={(x) => onChange(x === "__none__" ? "" : x)}>
        <SelectTrigger className="h-9 rounded-none border-0 bg-transparent focus:ring-1 focus:ring-inset focus:ring-ring">
          {v ? (
            <span
              className={cn(
                "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                statusClass(v),
              )}
            >
              {v}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">—</SelectItem>
          {presets.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (column.type === "checkbox") {
    return (
      <div className="flex h-9 items-center justify-center">
        <Checkbox
          checked={Boolean(value)}
          onCheckedChange={(c) => onChange(Boolean(c))}
        />
      </div>
    );
  }

  if (column.type === "longText") {
    return (
      <TextCell value={value} onChange={onChange} type="text" multiline />
    );
  }
  if (column.type === "number") {
    return <TextCell value={value} onChange={(v) => onChange(v === "" ? "" : Number(v))} type="number" />;
  }
  if (column.type === "date") {
    return <TextCell value={value} onChange={onChange} type="date" />;
  }
  if (column.type === "link") {
    return <TextCell value={value} onChange={onChange} type="url" />;
  }
  return <TextCell value={value} onChange={onChange} type="text" />;
}

function TextCell({
  value,
  onChange,
  type,
  multiline,
}: {
  value: unknown;
  onChange: (v: string) => void;
  type: string;
  multiline?: boolean;
}) {
  const [local, setLocal] = useState(value == null ? "" : String(value));
  // sync when value changes externally
  useMemo(() => {
    setLocal(value == null ? "" : String(value));
  }, [value]);

  const commit = () => {
    if (local !== (value == null ? "" : String(value))) onChange(local);
  };

  if (multiline) {
    return (
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        rows={2}
        className="block w-full resize-y bg-transparent px-3 py-2 text-sm outline-none focus:bg-accent/30 focus:ring-1 focus:ring-inset focus:ring-ring"
      />
    );
  }

  return (
    <input
      type={type}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className="block h-9 w-full bg-transparent px-3 text-sm outline-none focus:bg-accent/30 focus:ring-1 focus:ring-inset focus:ring-ring"
    />
  );
}

function AddColumnDialog({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<ColumnType>("text");
  const [optionsText, setOptionsText] = useState("");
  const [initialRows, setInitialRows] = useState<string>("");

  const create = useMutation({
    mutationFn: () => {
      const n = parseInt(initialRows, 10);
      return api<Column>(`/api/projects/${projectId}/columns`, {
        method: "POST",
        json: {
          label,
          type,
          options:
            type === "dropdown"
              ? optionsText.split(",").map((s) => s.trim()).filter(Boolean)
              : undefined,
          initialRows: Number.isFinite(n) && n > 0 ? n : undefined,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["columns", projectId] });
      qc.invalidateQueries({ queryKey: ["rows", projectId] });
      toast.success("Column added");
      onClose();
      setLabel("");
      setOptionsText("");
      setType("text");
      setInitialRows("");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add column</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim()) return;
          create.mutate();
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label>Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} required autoFocus />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as ColumnType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COLUMN_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {type === "dropdown" && (
          <div className="space-y-2">
            <Label>Options (comma-separated)</Label>
            <Input
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder="Option 1, Option 2, Option 3"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Rows to allocate</Label>
          <Input
            type="number"
            min={0}
            max={1000}
            value={initialRows}
            onChange={(e) => setInitialRows(e.target.value)}
            placeholder="e.g. 10 — leave blank for none"
          />
          <p className="text-xs text-muted-foreground">
            Ensures the table has at least this many rows. Existing rows are kept.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Adding…" : "Add column"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}


/* ----------------------------- Bugs view ----------------------------- */

type SortKey = "createdAt" | "bugId" | "severity" | "priority" | "status" | "title";
const SEVERITY_ORDER: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const PRIORITY_ORDER: Record<string, number> = { P1: 4, P2: 3, P3: 2, P4: 1 };
const STATUS_ORDER: Record<string, number> = { Open: 5, "In Progress": 4, Resolved: 3, Closed: 2, "Wont Fix": 1 };

function BugsView({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bug | null>(null);
  const [search, setSearch] = useState("");
  const [fSeverity, setFSeverity] = useState<string>("all");
  const [fPriority, setFPriority] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const bugs = useQuery({
    queryKey: ["bugs", projectId],
    queryFn: () => api<Bug[]>(`/api/projects/${projectId}/bugs`),
  });

  const visibleBugs = useMemo(() => {
    const list = bugs.data ?? [];
    const q = search.trim().toLowerCase();
    const filtered = list.filter((b) => {
      if (fSeverity !== "all" && b.severity !== fSeverity) return false;
      if (fPriority !== "all" && b.priority !== fPriority) return false;
      if (fStatus !== "all" && b.status !== fStatus) return false;
      if (q && !`${b.bugId} ${b.title} ${b.description ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "severity") cmp = (SEVERITY_ORDER[a.severity] ?? 0) - (SEVERITY_ORDER[b.severity] ?? 0);
      else if (sortKey === "priority") cmp = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
      else if (sortKey === "status") cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
      else if (sortKey === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else cmp = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [bugs.data, search, fSeverity, fPriority, fStatus, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "createdAt" ? "desc" : "asc"); }
  }

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/projects/${projectId}/bugs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bugs", projectId] });
      toast.success("Bug deleted");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });


  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Defects
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Bugs</h2>
        </div>
        <Dialog
          open={open || editing !== null}
          onOpenChange={(o) => {
            if (!o) {
              setOpen(false);
              setEditing(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New bug
            </Button>
          </DialogTrigger>
          <BugDialog
            projectId={projectId}
            bug={editing}
            onClose={() => {
              setOpen(false);
              setEditing(null);
            }}
          />
        </Dialog>
      </div>

      {bugs.isLoading ? (
        <div className="font-mono text-xs text-muted-foreground">Loading bugs…</div>
      ) : bugs.data && bugs.data.length > 0 ? (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search id, title, description…"
              className="h-9 max-w-xs"
            />
            <Select value={fSeverity} onValueChange={setFSeverity}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                {["Critical","High","Medium","Low"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fPriority} onValueChange={setFPriority}>
              <SelectTrigger className="h-9 w-[120px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {["P1","P2","P3","P4"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {["Open","In Progress","Resolved","Closed","Wont Fix"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || fSeverity !== "all" || fPriority !== "all" || fStatus !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFSeverity("all"); setFPriority("all"); setFStatus("all"); }}>
                Clear
              </Button>
            )}
            <div className="ml-auto font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {visibleBugs.length} / {bugs.data.length}
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  {([
                    ["bugId", "ID"],
                    ["title", "Title"],
                    ["severity", "Severity"],
                    ["priority", "Priority"],
                    ["status", "Status"],
                    ["createdAt", "Created"],
                  ] as [SortKey, string][]).map(([k, h]) => (
                    <th
                      key={k}
                      onClick={() => toggleSort(k)}
                      className="cursor-pointer select-none px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      {h}{sortKey === k ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                    </th>
                  ))}
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {visibleBugs.map((b) => (
                  <tr
                    key={b.id}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/30"
                    onClick={() => setEditing(b)}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{b.bugId}</td>
                    <td className="px-3 py-2 font-medium">{b.title}</td>
                    <td className="px-3 py-2">
                      <span className={cn("inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider", statusClass(b.severity))}>
                        {b.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider", statusClass(b.priority))}>
                        {b.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider", statusClass(b.status))}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {new Date(b.createdAt).toISOString().slice(0, 10)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete ${b.bugId}?`)) del.mutate(b.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleBugs.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center font-mono text-xs text-muted-foreground">No bugs match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>

      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <BugIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 text-lg font-semibold">No bugs reported</h3>
          <p className="mt-1 text-sm text-muted-foreground">Log defects discovered during testing.</p>
          <Button className="mt-4" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New bug
          </Button>
        </div>
      )}
    </div>
  );
}

function BugDialog({
  projectId,
  bug,
  onClose,
}: {
  projectId: string;
  bug: Bug | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(bug?.title ?? "");
  const [description, setDescription] = useState(bug?.description ?? "");
  const [severity, setSeverity] = useState<Bug["severity"]>(bug?.severity ?? "Medium");
  const [priority, setPriority] = useState<Bug["priority"]>(bug?.priority ?? "P3");
  const [status, setStatus] = useState<Bug["status"]>(bug?.status ?? "Open");
  const [steps, setSteps] = useState(bug?.stepsToReproduce ?? "");
  const [expected, setExpected] = useState(bug?.expectedResult ?? "");
  const [actual, setActual] = useState(bug?.actualResult ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(bug?.attachments ?? []);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        description,
        severity,
        priority,
        status,
        stepsToReproduce: steps,
        expectedResult: expected,
        actualResult: actual,
        attachments: attachments.map((a) => a.id),
      };
      if (bug) {
        return api(`/api/projects/${projectId}/bugs/${bug.id}`, {
          method: "PATCH",
          json: payload,
        });
      }
      return api(`/api/projects/${projectId}/bugs`, { method: "POST", json: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bugs", projectId] });
      toast.success(bug ? "Bug updated" : "Bug created");
      onClose();
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {bug ? (
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{bug.bugId}</span>
              <span>Edit bug</span>
            </span>
          ) : (
            "New bug"
          )}
        </DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          save.mutate();
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as Bug["severity"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEVERITY_PRESETS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Bug["priority"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITY_PRESETS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Bug["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Open", "In Progress", "Resolved", "Closed", "Wont Fix"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <Label>Steps to reproduce</Label>
            <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Expected result</Label>
              <Textarea value={expected} onChange={(e) => setExpected(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Actual result</Label>
              <Textarea value={actual} onChange={(e) => setActual(e.target.value)} rows={2} />
            </div>
          </div>
        </div>
        <AttachmentsField
          projectId={projectId}
          attachments={attachments}
          onChange={setAttachments}
        />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : bug ? "Save changes" : "Create bug"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

/* ----------------------------- Attachments ---------------------------- */

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function resourceTypeFor(file: File): "image" | "video" | "raw" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "raw";
}

function AttachmentIcon({ a }: { a: Attachment }) {
  if (a.resourceType === "image") return <ImageIcon className="h-4 w-4" />;
  if (a.resourceType === "video") return <Film className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
}

function AttachmentsField({
  projectId,
  attachments,
  onChange,
}: {
  projectId: string;
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        const resourceType = resourceTypeFor(file);
        const sign = await api<{
          timestamp: number;
          signature: string;
          folder: string;
          apiKey: string;
          cloudName: string;
        }>("/api/attachments/sign", {
          method: "POST",
          json: { resourceType },
        });

        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sign.apiKey);
        form.append("timestamp", String(sign.timestamp));
        form.append("signature", sign.signature);
        form.append("folder", sign.folder);

        const cloudUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/${resourceType}/upload`;
        const res = await fetch(cloudUrl, { method: "POST", body: form });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Upload failed: ${err.slice(0, 200)}`);
        }
        const cld = (await res.json()) as {
          public_id: string;
          secure_url: string;
          bytes: number;
          format?: string;
        };

        const att = await api<Attachment>("/api/attachments/register", {
          method: "POST",
          json: {
            publicId: cld.public_id,
            secureUrl: cld.secure_url,
            resourceType,
            fileName: file.name,
            fileType: file.type,
            fileSize: cld.bytes ?? file.size,
            projectId,
          },
        });
        uploaded.push(att);
      }
      onChange([...attachments, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Paperclip className="h-3.5 w-3.5" /> Attachments
      </Label>

      {attachments.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2">
              <span className="text-muted-foreground"><AttachmentIcon a={a} /></span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {a.fileName || a.secureUrl?.split("/").pop() || "Attachment"}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {a.fileSize ? formatBytes(a.fileSize) : ""}
              </span>
              {a.secureUrl && (
                <button
                  type="button"
                  onClick={() => setPreview(a)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="View attachment"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
              )}
              <button
                type="button"
                onClick={() => onChange(attachments.filter((x) => x.id !== a.id))}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove attachment"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <label
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent/40",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading…" : "Click to upload (image / video / PDF)"}
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
          accept="image/*,video/*,application/pdf"
        />
      </label>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="border-b border-border px-4 py-3">
            <DialogTitle className="flex items-center gap-2 text-sm">
              {preview && <AttachmentIcon a={preview} />}
              <span className="truncate">{preview?.fileName || "Attachment"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[75vh] items-center justify-center overflow-auto bg-black/80 p-4 animate-in zoom-in-95 duration-200">
            {preview?.resourceType === "image" && (
              <img
                src={preview.secureUrl}
                alt={preview.fileName}
                className="max-h-[70vh] max-w-full rounded object-contain shadow-2xl"
              />
            )}
            {preview?.resourceType === "video" && (
              <video
                src={preview.secureUrl}
                controls
                autoPlay
                className="max-h-[70vh] max-w-full rounded shadow-2xl"
              />
            )}
            {preview?.resourceType === "raw" && (
              <iframe
                src={preview.secureUrl}
                title={preview.fileName}
                className="h-[70vh] w-full rounded bg-white"
              />
            )}
          </div>
          <DialogFooter className="border-t border-border px-4 py-2">
            <a
              href={preview?.secureUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Open in new tab
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

