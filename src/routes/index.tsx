import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { LoadingScreen } from "@/components/loading-screen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QAX — Sign in" },
      { name: "description", content: "QA test management with engineered precision." },
    ],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingScreen label="Authenticating" />;
  }
  return <Navigate to={user ? "/dashboard" : "/login"} />;
}
