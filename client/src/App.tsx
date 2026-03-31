import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

import LoginPage from "@/pages/login";
import AdminDashboard from "@/pages/admin/dashboard";
import MembersPage from "@/pages/admin/members";
import MemberDashboard from "@/pages/member/dashboard";

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
    </div>
  );
}

function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Redirect to="/login" />;
  return <Redirect to={user.role === "admin" ? "/admin" : "/member"} />;
}

function ProtectedAdmin({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Redirect to="/login" />;
  if (user.role !== "admin") return <Redirect to="/member" />;
  return <Component />;
}

function ProtectedMember() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Redirect to="/login" />;
  if (user.role === "admin") return <Redirect to="/admin" />;
  return <MemberDashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin">
        <ProtectedAdmin component={AdminDashboard} />
      </Route>
      <Route path="/admin/members">
        <ProtectedAdmin component={MembersPage} />
      </Route>
      <Route path="/member" component={ProtectedMember} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
