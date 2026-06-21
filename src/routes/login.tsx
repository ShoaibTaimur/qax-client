import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { UserPlus } from "lucide-react";
const faviconAsset = { url: "/favicon.png" };

const loginSearchSchema = z.object({
  add: z.coerce.number().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — QAX" },
      { name: "description", content: "Sign in to your QAX workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const addMode = search.add === 1;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (addMode) return; // stay on login form even if a session exists
    if (!loading && user) {
      if (user.mustChangePassword) {
        navigate({ to: "/profile" });
      } else {
        navigate({ to: "/projects" });
      }
    }
  }, [user, loading, navigate, addMode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username.trim(), password, { addAccount: addMode });
      toast.success(addMode ? "Account added" : "Welcome back");
      navigate({ to: "/projects" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2 animate-fade-in">

      {/* Brand panel */}
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <img
            src={faviconAsset.url}
            alt="QAX"
            className="h-9 w-9 rounded-md"
          />
          <span className="font-mono text-sm uppercase tracking-[0.2em]">QAX</span>
        </div>
        <div className="space-y-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-sidebar-primary">
            v1.0 — Engineered Precision
          </p>
          <h1 className="text-4xl font-semibold leading-tight">
            Test management,<br />
            built for engineers.
          </h1>
          <p className="max-w-md text-sm text-sidebar-foreground/70">
            Dynamic tables. Bug tracking with attachments. Excel & PDF exports.
            Every action audited.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded border border-sidebar-border bg-sidebar-border text-xs">
          {[
            ["Projects", "∞"],
            ["Columns", "11 types"],
            ["Exports", "XLSX · PDF"],
          ].map(([k, v]) => (
            <div key={k} className="bg-sidebar p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
                {k}
              </div>
              <div className="mt-1 font-mono text-sm text-sidebar-foreground">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-3">
            <img
              src={faviconAsset.url}
              alt="QAX"
              className="h-9 w-9 rounded-md"
            />
            <span className="font-mono text-sm uppercase tracking-[0.2em]">QAX</span>
          </div>

          {addMode && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 animate-fade-in">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary">
                <UserPlus className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium">Adding another account</div>
                <div className="text-[11px] text-muted-foreground">
                  {user ? <>You'll stay signed in as <span className="font-mono">{user.username}</span>.</> : "Sign in to add a new account."}
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Authentication
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {addMode ? "Add account" : "Sign in"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your QAX credentials to continue.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-mono text-[11px] uppercase tracking-wider">
                Username
              </Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-[11px] uppercase tracking-wider">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Signing in…" : addMode ? "Add account" : "Sign in"}
          </Button>

          {addMode && (
            <button
              type="button"
              onClick={() => navigate({ to: "/projects" })}
              className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel and go back
            </button>
          )}

          <p className="text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            QAX · Secure session
          </p>
          <p className="text-center text-xs text-muted-foreground/60">
            Made by{" "}
            <a
              href="https://taimur.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              Md Shoaib Taimur
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
