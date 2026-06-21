import { createFileRoute, Link, Outlet, useLocation, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { useAuth, type AccountEntry, type AuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  FolderKanban,
  Shield,
  LayoutTemplate,
  ScrollText,
  LogOut,
  Sun,
  Moon,
  Check,
  UserPlus,
  UserRound,
  X,
  ChevronsUpDown,
} from "lucide-react";
const faviconAsset = { url: "/favicon.png" };
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { AccountSwitchOverlay } from "@/components/account-switch-overlay";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
    if (!loading && user && user.mustChangePassword && location.pathname !== "/profile") {
      navigate({ to: "/profile" });
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading || !user) {
    return <LoadingScreen label="Authenticating" />;
  }

  return (
    <SidebarProvider>
      <NavigationProgress />
      <AccountSwitchOverlay />
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <SidebarTrigger className="shrink-0" />
            <div className="flex min-w-0 items-center gap-2">
              <img
                src={faviconAsset.url}
                alt="QAX"
                className="h-6 w-6 shrink-0 rounded"
              />
              <span className="font-mono text-xs uppercase tracking-[0.2em]">QAX</span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <AccountSwitcher />
            </div>
          </header>
          <div key={location.pathname} className="min-w-0 animate-fade-in">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function NavigationProgress() {
  const isLoading = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });
  if (!isLoading) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] overflow-hidden bg-transparent">
      <div className="h-full w-1/3 animate-[qax-progress_1.1s_ease-in-out_infinite] bg-primary" />
    </div>
  );
}

function userInitials(name?: string) {
  if (!name) return "U";
  return (
    name
      .split(/[\s._-]+/)
      .map((s) => s.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "U"
  );
}

function UserAvatar({
  user,
  className,
}: {
  user: Pick<AuthUser, "username" | "avatarUrl">;
  className?: string;
}) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.username} /> : null}
      <AvatarFallback className="bg-gradient-to-br from-primary/40 to-primary/10 font-mono text-[11px] font-semibold">
        {userInitials(user.username)}
      </AvatarFallback>
    </Avatar>
  );
}

function AccountSwitcher() {
  const { user, accounts, switchAccount, removeAccount, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const others = accounts.filter((a) => a.user.id !== user.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2 rounded-full border border-transparent px-1 py-0.5 transition-all hover:border-border hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <UserAvatar
            user={user}
            className="h-8 w-8 ring-2 ring-background transition-transform group-hover:scale-105"
          />
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-72 overflow-hidden p-0"
      >
        {/* Current account header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_top_right,hsl(var(--primary)/0.25),transparent_60%)]" />
          <div className="relative flex items-center gap-3">
            <UserAvatar user={user} className="h-12 w-12 ring-2 ring-primary/40" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user.username}</div>
              <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Active · {user.role}
              </div>
            </div>
          </div>
        </div>

        {others.length > 0 && (
          <>
            <DropdownMenuLabel className="px-3 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Switch account
            </DropdownMenuLabel>
            <div className="space-y-0.5 px-1 pb-1">
              {others.map((acc, i) => (
                <AccountRow
                  key={acc.user.id}
                  acc={acc}
                  index={i}
                  onSwitch={() => void switchAccount(acc.user.id)}
                  onRemove={() => removeAccount(acc.user.id)}
                />
              ))}
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer gap-2 px-3 py-2"
          onSelect={() => navigate({ to: "/login", search: { add: 1 } as never })}
        >
          <div className="grid h-7 w-7 place-items-center rounded-full border border-dashed border-border bg-muted/40">
            <UserPlus className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm">Add another account</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer gap-2 px-3 py-2"
          onSelect={() => navigate({ to: "/profile" })}
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-muted/40">
            <UserRound className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm">Profile settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer gap-2 px-3 py-2 text-destructive focus:text-destructive"
          onSelect={async () => {
            await logout();
            navigate({ to: "/login" });
          }}
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-destructive/10 text-destructive">
            <LogOut className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm">Sign out{others.length > 0 ? " of this account" : ""}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountRow({
  acc,
  index,
  onSwitch,
  onRemove,
}: {
  acc: AccountEntry;
  index: number;
  onSwitch: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="group/row flex items-center gap-2 rounded-md px-2 py-1.5 opacity-0 animate-fade-in transition-colors hover:bg-accent/70"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "forwards" }}
    >
      <button
        type="button"
        onClick={onSwitch}
        className="flex flex-1 items-center gap-3 text-left"
      >
        <UserAvatar
          user={acc.user}
          className="h-9 w-9 transition-transform group-hover/row:scale-110"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{acc.user.username}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {acc.user.role}
          </div>
        </div>
        <Check className="h-4 w-4 -translate-x-2 opacity-0 text-primary transition-all group-hover/row:translate-x-0 group-hover/row:opacity-100" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/row:opacity-100"
        aria-label={`Remove ${acc.user.username}`}
        title="Remove from this device"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/templates", label: "Templates", icon: LayoutTemplate },
    ...(user?.role === "admin"
      ? [
          { to: "/admin/users", label: "Users", icon: Shield },
          { to: "/admin/audit", label: "Audit log", icon: ScrollText },
        ]
      : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1">
          <img
            src={faviconAsset.url}
            alt="QAX"
            className="h-8 w-8 shrink-0 rounded-md"
          />
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-sidebar-foreground">
                QAX
              </div>
              <div className="text-[10px] text-sidebar-foreground/50">v1.0</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link to={item.to} onClick={() => setOpenMobile(false)}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {user && (
            <UserAvatar
              user={user}
              className={collapsed ? "h-8 w-8 mx-auto" : "h-8 w-8"}
            />
          )}
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm text-sidebar-foreground">{user?.username}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
                {user?.role}
              </div>
            </div>
          )}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={async () => {
            await logout();
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </Button>
        {!collapsed && (
          <p className="px-2 text-[10px] text-sidebar-foreground/40">
            Made by{" "}
            <a
              href="https://taimur.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-sidebar-foreground/70 transition-colors"
            >
              Md Shoaib Taimur
            </a>
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
