import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
const faviconAsset = { url: "/favicon.png" };

export const Route = createFileRoute("/login")({
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.mustChangePassword) {
        navigate({ to: "/profile" });
      } else {
        navigate({ to: "/projects" });
      }
    }
  }, [user, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      toast.success("Welcome back");
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
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Authentication
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Sign in</h2>
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
            {submitting ? "Signing in…" : "Sign in"}
          </Button>

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
