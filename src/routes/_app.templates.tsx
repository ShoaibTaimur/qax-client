import { createFileRoute } from "@tanstack/react-router";
import { InlineLoader } from "@/components/loading-screen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from "sonner";

export const Route = createFileRoute("/_app/templates")({
  head: () => ({ meta: [{ title: "Templates — QAX" }] }),
  component: TemplatesPage,
});

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
  "attachment",
  "checkbox",
] as const;

type ColType = (typeof COLUMN_TYPES)[number];

type TemplateColumn = {
  label: string;
  type: ColType;
  options?: string[];
};

type Template = {
  id: string;
  name: string;
  description: string;
  builtIn: boolean;
  ownerId?: string | null;
  defaultRows?: number;
  columns: TemplateColumn[];
};


function TemplatesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const templates = useQuery({
    queryKey: ["templates"],
    queryFn: () => api<Template[]>("/api/templates"),
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Template deleted");
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Library
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pre-built column sets you can apply when creating a project.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New template
            </Button>
          </DialogTrigger>
          <CreateTemplateDialog
            onCreated={() => {
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["templates"] });
            }}
          />
        </Dialog>
      </header>

      {templates.isLoading ? (
        <InlineLoader />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.data?.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {t.builtIn ? (
                    <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
                      Built-in
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                        Custom
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete template "${t.name}"?`)) del.mutate(t.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1">
                {t.columns.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px]"
                  >
                    <span>{c.label}</span>
                    <span className="text-muted-foreground">·{c.type}</span>
                  </span>
                ))}
              </div>
              {(t.defaultRows ?? 0) > 0 && (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Seeds {t.defaultRows} row{t.defaultRows === 1 ? "" : "s"} on use
                </p>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateTemplateDialog({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultRows, setDefaultRows] = useState<string>("");
  const [columns, setColumns] = useState<TemplateColumn[]>([
    { label: "Title", type: "text" },
  ]);

  const create = useMutation({
    mutationFn: () => {
      const n = parseInt(defaultRows, 10);
      return api<Template>("/api/templates", {
        method: "POST",
        json: {
          name: name.trim(),
          description: description.trim(),
          defaultRows: Number.isFinite(n) && n > 0 ? n : 0,
          columns: columns
            .filter((c) => c.label.trim())
            .map((c) => ({
              label: c.label.trim(),
              type: c.type,
              options:
                needsOptions(c.type) && c.options?.length
                  ? c.options.map((o) => o.trim()).filter(Boolean)
                  : undefined,
            })),
        },
      });
    },
    onSuccess: () => {
      toast.success("Template created");
      setName("");
      setDescription("");
      setDefaultRows("");
      setColumns([{ label: "Title", type: "text" }]);
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const updateCol = (i: number, patch: Partial<TemplateColumn>) =>
    setColumns((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const canSubmit =
    name.trim().length > 0 &&
    columns.some((c) => c.label.trim()) &&
    !create.isPending;

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create template</DialogTitle>
        <DialogDescription>
          Define a reusable set of columns for new projects.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tpl-name">Name</Label>
          <Input
            id="tpl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Regression Sweep"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tpl-desc">Description</Label>
          <Textarea
            id="tpl-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this template for?"
            rows={2}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tpl-rows">Default rows to allocate</Label>
          <Input
            id="tpl-rows"
            type="number"
            min={0}
            max={1000}
            value={defaultRows}
            onChange={(e) => setDefaultRows(e.target.value)}
            placeholder="e.g. 10 — leave blank for none"
          />
          <p className="text-xs text-muted-foreground">
            Projects created from this template will start with this many empty rows.
          </p>
        </div>


        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>Columns</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setColumns((cs) => [...cs, { label: "", type: "text" }])
              }
            >
              <Plus className="mr-1 h-3 w-3" /> Add column
            </Button>
          </div>

          <div className="space-y-2">
            {columns.map((c, i) => (
              <div
                key={i}
                className="rounded border border-border bg-muted/30 p-2"
              >
                <div className="flex gap-2">
                  <Input
                    value={c.label}
                    onChange={(e) => updateCol(i, { label: e.target.value })}
                    placeholder="Column label"
                    className="flex-1"
                  />
                  <Select
                    value={c.type}
                    onValueChange={(v) =>
                      updateCol(i, { type: v as ColType, options: undefined })
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={columns.length === 1}
                    onClick={() =>
                      setColumns((cs) => cs.filter((_, idx) => idx !== i))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {needsOptions(c.type) && (
                  <Input
                    className="mt-2"
                    value={(c.options ?? []).join(", ")}
                    onChange={(e) =>
                      updateCol(i, {
                        options: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Options (comma separated)"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          onClick={() => create.mutate()}
          disabled={!canSubmit}
        >
          {create.isPending ? "Creating…" : "Create template"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function needsOptions(type: ColType): boolean {
  return type === "dropdown";
}
