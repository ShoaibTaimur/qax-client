import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth, type AuthUser } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ArrowLeft, Camera, KeyRound, Loader2, Shield, Trash2, User } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — QAX" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, refresh, setUser } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const changePassword = useMutation({
    mutationFn: () =>
      api("/api/auth/change-password", {
        method: "POST",
        json: { currentPassword, newPassword },
      }),
    onSuccess: () => {
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      void refresh();
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    changePassword.mutate();
  }

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const sign = await api<{
        timestamp: number;
        signature: string;
        folder: string;
        apiKey: string;
        cloudName: string;
      }>("/api/attachments/sign", {
        method: "POST",
        json: { resourceType: "image" },
      });

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.apiKey);
      form.append("timestamp", String(sign.timestamp));
      form.append("signature", sign.signature);
      form.append("folder", sign.folder);

      const cloudUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;
      const res = await fetch(cloudUrl, { method: "POST", body: form });
      if (!res.ok) throw new Error("Cloudinary upload failed");
      const cld = (await res.json()) as { secure_url: string };

      const updated = await api<AuthUser>("/api/auth/me", {
        method: "PATCH",
        json: { avatarUrl: cld.secure_url },
      });
      setUser(updated);
      toast.success("Profile picture updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setUploadingAvatar(true);
    try {
      const updated = await api<AuthUser>("/api/auth/me", {
        method: "PATCH",
        json: { avatarUrl: null },
      });
      setUser(updated);
      toast.success("Profile picture removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setUploadingAvatar(false);
    }
  }

  const initials =
    user?.username
      ?.split(/[\s._-]+/)
      .map((s) => s.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") ?? "U";

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
      <header className="mb-8">
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </button>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account details and security settings.
        </p>
      </header>

      <div className="space-y-6">
        {/* Avatar card */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Profile picture
          </h2>
          <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-border">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.username} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 font-mono text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {uploadingAvatar && (
                <div className="absolute inset-0 grid place-items-center rounded-full bg-background/70 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">
                Upload a square image — at least 128×128 px. PNG or JPG, max 5 MB.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  disabled={uploadingAvatar}
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  {user?.avatarUrl ? "Change picture" : "Upload picture"}
                </Button>
                {user?.avatarUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={uploadingAvatar}
                    onClick={removeAvatar}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadAvatar(f);
                }}
              />
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Account
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoRow icon={User} label="Username" value={user?.username ?? "—"} />
            <InfoRow
              icon={Shield}
              label="Role"
              value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—"}
            />
            <InfoRow
              icon={User}
              label="Member since"
              value={user?.createdAt ? fmtDate(user.createdAt) : "—"}
            />
            <InfoRow
              icon={User}
              label="Last login"
              value={user?.lastLoginAt ? fmtDate(user.lastLoginAt) : "—"}
            />
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Security
          </h2>
          <form onSubmit={handleChangePassword} className="mt-4 max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current" className="font-mono text-[11px] uppercase tracking-wider">
                Current password
              </Label>
              <div className="relative">
                <Input
                  id="current"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new" className="font-mono text-[11px] uppercase tracking-wider">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="new"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {showNew ? "Hide" : "Show"}
                </button>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                At least 8 characters with upper, lower, and digit.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="font-mono text-[11px] uppercase tracking-wider">
                Confirm new password
              </Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={changePassword.isPending}
              className="gap-2"
            >
              <KeyRound className="h-4 w-4" />
              {changePassword.isPending ? "Updating…" : "Change password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}
