import { createFileRoute } from "@tanstack/react-router";
import { InlineLoader } from "@/components/loading-screen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, KeyRound, UserX, UserCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/users")({
  head: () => ({ meta: [{ title: "Users — QAX Admin" }] }),
  component: AdminUsersPage,
});

type AdminUser = {
  id: string;
  username: string;
  role: "admin" | "tester";
  disabled: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt: string;
};

function AdminUsersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState<AdminUser | null>(null);

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api<AdminUser[]>("/api/users"),
  });

  const disable = useMutation({
    mutationFn: ({ id, disabled }: { id: string; disabled: boolean }) =>
      api(`/api/users/${id}/disable`, { method: "POST", json: { disabled } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => api(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Admin</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Users</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New user</Button>
          </DialogTrigger>
          <CreateUserDialog onClose={() => setOpen(false)} />
        </Dialog>
      </header>

      {users.isLoading ? (
        <InlineLoader />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["Username", "Role", "Status", "Last login", "Created", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.data?.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{u.username}</td>
                  <td className="px-3 py-2">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"} className="font-mono text-[10px] uppercase tracking-wider">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    {u.disabled ? (
                      <span className="font-mono text-[11px] uppercase tracking-wider text-destructive">Disabled</span>
                    ) : u.mustChangePassword ? (
                      <span className="font-mono text-[11px] uppercase tracking-wider text-warning">Must reset pw</span>
                    ) : (
                      <span className="font-mono text-[11px] uppercase tracking-wider text-success">Active</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toISOString().slice(0, 10) : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {new Date(u.createdAt).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setResetting(u)}>
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => disable.mutate({ id: u.id, disabled: !u.disabled })}
                        title={u.disabled ? "Enable" : "Disable"}
                      >
                        {u.disabled ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Delete user "${u.username}"?`)) del.mutate(u.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={resetting !== null} onOpenChange={(o) => !o && setResetting(null)}>
        {resetting && (
          <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />
        )}
      </Dialog>
    </div>
  );
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "tester">("tester");
  const m = useMutation({
    mutationFn: () => api("/api/users", { method: "POST", json: { username, password, role } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User created");
      onClose();
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New user</DialogTitle></DialogHeader>
      <form
        onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label>Username</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </div>
        <div className="space-y-2">
          <Label>Temporary password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            User will be required to change it on first login.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as "admin" | "tester")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tester">Tester</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={m.isPending}>
            {m.isPending ? "Creating…" : "Create user"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [pw, setPw] = useState("");
  const m = useMutation({
    mutationFn: () =>
      api(`/api/users/${user.id}/reset-password`, {
        method: "POST",
        json: { newPassword: pw, forceChange: true },
      }),
    onSuccess: () => {
      toast.success("Password reset");
      onClose();
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Reset password — {user.username}</DialogTitle>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-4">
        <div className="space-y-2">
          <Label>New password</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required autoFocus />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={m.isPending}>
            {m.isPending ? "Saving…" : "Reset password"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
