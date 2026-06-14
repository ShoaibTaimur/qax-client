import { createFileRoute, Link, Outlet, useLocation, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { useAuth } from "@/lib/auth";
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
import { LayoutDashboard, FolderKanban, Shield, LayoutTemplate, ScrollText, LogOut, Sun, Moon } from "lucide-react";
import faviconAsset from "@/assets/favicon.png.asset.json";
import { useTheme } from "@/lib/theme";

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
          className="block rounded-md px-2 py-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {!collapsed && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
                {user?.role}
              </div>
              <div className="truncate text-sm text-sidebar-foreground">{user?.username}</div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-mono text-xs font-bold">
                {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
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
