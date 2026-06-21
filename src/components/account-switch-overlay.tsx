import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, type AuthUser } from "@/lib/auth";
import { Check, Loader2 } from "lucide-react";

function initials(name: string) {
  return (
    name
      .split(/[\s._-]+/)
      .map((s) => s.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "U"
  );
}

function AvatarBlock({ user, size = 80 }: { user: AuthUser; size?: number }) {
  return (
    <Avatar
      style={{ height: size, width: size }}
      className="ring-4 ring-primary/30 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.6)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
    >
      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.username} /> : null}
      <AvatarFallback className="bg-gradient-to-br from-primary/40 to-primary/10 font-mono text-xl font-semibold">
        {initials(user.username)}
      </AvatarFallback>
    </Avatar>
  );
}

export function AccountSwitchOverlay() {
  const { user, switching } = useAuth();

  const [phase, setPhase] = useState<"enter" | "active" | "done" | "exit" | null>(null);
  const [snapshot, setSnapshot] = useState<{ from: AuthUser | null; to: AuthUser } | null>(null);

  // Latest user, read inside effects without re-triggering them.
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Start choreography ONLY when the target id changes (new switch begins).
  const lastTargetId = useRef<string | null>(null);
  useEffect(() => {
    const targetId = switching?.id ?? null;
    if (targetId && targetId !== lastTargetId.current) {
      lastTargetId.current = targetId;
      const current = userRef.current;
      setSnapshot({
        from: current && current.id !== targetId ? current : null,
        to: switching!,
      });
      setPhase("enter");
      const t = setTimeout(() => setPhase("active"), 350);
      return () => clearTimeout(t);
    }
  }, [switching]);

  // When the active user catches up to the target, move to done.
  useEffect(() => {
    if (!snapshot) return;
    if (phase === "active" && user?.id === snapshot.to.id) {
      setPhase("done");
    }
  }, [phase, user?.id, snapshot]);

  // When the auth provider clears `switching`, finish the animation and unmount.
  useEffect(() => {
    if (switching) return;
    if (!snapshot) return;
    // Allow the "done" state to be visible briefly, then fade out and clean up.
    setPhase((p) => (p === "exit" ? p : "exit"));
    const t = setTimeout(() => {
      setPhase(null);
      setSnapshot(null);
      lastTargetId.current = null;
    }, 600);
    return () => clearTimeout(t);
  }, [switching, snapshot]);

  if (!snapshot || !phase) return null;

  const { from, to } = snapshot;
  const isEnter = phase === "enter";
  const isExit = phase === "exit";
  const isDone = phase === "done" || phase === "exit";

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        opacity: isExit ? 0 : 1,
        backdropFilter: `blur(${isEnter ? 0 : 16}px)`,
        WebkitBackdropFilter: `blur(${isEnter ? 0 : 16}px)`,
        backgroundColor: `hsl(var(--background) / ${isEnter || isExit ? 0 : 0.7})`,
      }}
      aria-live="polite"
      role="status"
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-[900ms]"
        style={{
          opacity: isEnter || isExit ? 0 : 1,
          background:
            "radial-gradient(circle at center, hsl(var(--primary) / 0.18), transparent 60%)",
        }}
      />

      <div
        className="relative flex flex-col items-center gap-6 rounded-2xl border border-border/60 bg-card/80 px-10 py-8 shadow-2xl transition-all duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: isEnter || isExit ? 0 : 1,
          transform: `scale(${isEnter ? 0.92 : isExit ? 0.97 : 1}) translateY(${
            isEnter ? 16 : isExit ? -8 : 0
          }px)`,
        }}
      >
        <div
          className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground transition-all duration-500"
          style={{
            opacity: isEnter ? 0 : 1,
            transform: `translateY(${isEnter ? -6 : 0}px)`,
          }}
        >
          {isDone ? "Signed in" : "Switching account"}
        </div>

        <div className="flex items-center gap-5">
          {from && (
            <>
              <div
                className="flex flex-col items-center gap-2 transition-all duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  opacity: isEnter ? 0 : isDone ? 0.35 : 0.7,
                  transform: `translateX(${isEnter ? -16 : 0}px) scale(${isDone ? 0.92 : 1})`,
                }}
              >
                <AvatarBlock user={from} size={72} />
                <div className="max-w-[8rem] truncate text-xs font-medium">{from.username}</div>
              </div>

              {/* Connector */}
              <div
                className="relative flex h-1 w-20 items-center overflow-hidden rounded-full bg-muted transition-all duration-500"
                style={{ opacity: isEnter ? 0 : 1 }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 transition-[width] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    width: isDone ? "100%" : isEnter ? "0%" : "55%",
                  }}
                />
                {!isDone && (
                  <div className="absolute inset-y-0 -left-1/3 w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary-foreground/40 to-transparent animate-[qax-progress_1.6s_ease-in-out_infinite]" />
                )}
              </div>
            </>
          )}

          <div
            className="relative flex flex-col items-center gap-2 transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              opacity: isEnter ? 0 : 1,
              transform: `translateX(${isEnter ? 16 : 0}px) scale(${isDone ? 1.04 : 1})`,
            }}
          >
            <div className="relative">
              <AvatarBlock user={to} size={84} />
              <div
                className="absolute -inset-2 -z-10 rounded-full bg-primary/25 blur-2xl transition-all duration-700"
                style={{
                  opacity: isEnter ? 0 : isDone ? 1 : 0.7,
                  transform: `scale(${isDone ? 1.15 : 1})`,
                }}
              />
              <div
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-card transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transform: `scale(${isEnter ? 0.6 : isDone ? 1.1 : 0.95}) rotate(${
                    isDone ? 0 : -45
                  }deg)`,
                  backgroundColor: isDone
                    ? "hsl(var(--primary))"
                    : "hsl(var(--background))",
                  color: isDone
                    ? "hsl(var(--primary-foreground))"
                    : "hsl(var(--primary))",
                }}
              >
                <div
                  className="absolute transition-all duration-500"
                  style={{ opacity: isDone ? 0 : 1, transform: `scale(${isDone ? 0.6 : 1})` }}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
                <div
                  className="absolute transition-all duration-500"
                  style={{ opacity: isDone ? 1 : 0, transform: `scale(${isDone ? 1 : 0.6})` }}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
              </div>
            </div>
            <div
              className="max-w-[8rem] truncate text-sm font-semibold transition-all duration-500"
              style={{ opacity: isEnter ? 0 : 1, transform: `translateY(${isEnter ? 6 : 0}px)` }}
            >
              {to.username}
            </div>
            <div
              className="font-mono text-[9px] uppercase tracking-widest text-primary transition-all duration-500"
              style={{ opacity: isEnter ? 0 : 1 }}
            >
              {to.role}
            </div>
          </div>
        </div>

        <div
          className="text-xs text-muted-foreground transition-all duration-500"
          style={{
            opacity: isEnter ? 0 : 1,
            transform: `translateY(${isEnter ? 6 : 0}px)`,
          }}
        >
          {isDone ? (
            <>You're now signed in as <span className="font-mono">{to.username}</span></>
          ) : (
            <>Hold tight — switching context…</>
          )}
        </div>
      </div>
    </div>
  );
}
