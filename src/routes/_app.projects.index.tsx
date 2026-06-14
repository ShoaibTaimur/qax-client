import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/projects/")({
  head: () => ({ meta: [{ title: "Projects — QAX" }] }),
  component: ProjectsPage,
});

type Project = {
  id: string;
  name: string;
  clientName: string;
  description: string;
  status: "active" | "archived" | "completed";
  createdAt: string;
};

type Template = {
  id: string;
  name: string;
  builtIn: boolean;
  description: string;
};

function ProjectsPage() {
  const qc = useQueryClient();
  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<Project[]>("/api/projects"),
  });
  const templates = useQuery({
    queryKey: ["templates"],
    queryFn: () => api<Template[]>("/api/templates"),
  });

  const [open, setOpen] = useState(false);

  const del = useMutation({
    mutationFn: (id: string) => api(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Project deleted");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => api(`/api/projects/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Project duplicated");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Workspace
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Test suites, organised by project.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New project
            </Button>
          </DialogTrigger>
          <CreateProjectDialog
            templates={templates.data ?? []}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      </header>

      {projects.isLoading ? (
        <div className="font-mono text-xs text-muted-foreground">Loading…</div>
      ) : projects.data && projects.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data.map((p) => (
            <div
              key={p.id}
              className="group relative flex flex-col rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <Badge
                  variant={p.status === "active" ? "default" : "secondary"}
                  className="font-mono text-[10px] uppercase tracking-wider"
                >
                  {p.status}
                </Badge>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => duplicate.mutate(p.id)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
                        del.mutate(p.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Link
                to="/projects/$projectId"
                params={{ projectId: p.id }}
                className="block flex-1"
              >
                <h3 className="text-lg font-semibold tracking-tight">{p.name}</h3>
                {p.clientName && (
                  <div className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {p.clientName}
                  </div>
                )}
                {p.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                )}
              </Link>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="font-mono">
                  {new Date(p.createdAt).toISOString().slice(0, 10)}
                </span>
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Open <FolderOpen className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-muted">
            <FolderKanbanIcon />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first project to start tracking test cases.
          </p>
          <Button className="mt-4" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New project
          </Button>
        </div>
      )}
    </div>
  );
}

function FolderKanbanIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <path d="M20 7h-7l-2-2H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
    </svg>
  );
}

function CreateProjectDialog({
  templates,
  onClose,
}: {
  templates: Template[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState<string>("none");

  const create = useMutation({
    mutationFn: () =>
      api<Project>("/api/projects", {
        method: "POST",
        json: {
          name,
          clientName,
          description,
          templateId: templateId === "none" ? undefined : templateId,
        },
      }),
    onSuccess: () => {
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: ["projects"] });
      onClose();
      setName("");
      setClientName("");
      setDescription("");
      setTemplateId("none");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New project</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          create.mutate();
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="np-name">Project name</Label>
          <Input id="np-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="space-y-2">
          <Label htmlFor="np-client">Client name</Label>
          <Input id="np-client" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="np-desc">Description</Label>
          <Textarea id="np-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Start from template</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Empty project</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} {t.builtIn && <span className="ml-1 font-mono text-[10px] text-muted-foreground">BUILT-IN</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create project"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
