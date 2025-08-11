import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { auth } from "./lib/auth";

import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Investments from "@/pages/investments";
import Analytics from "@/pages/analytics";
import Goals from "@/pages/goals";
import Navbar from "@/components/layout/navbar";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/investments" component={Investments} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/goals" component={Goals} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function Router() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => auth.getCurrentUser(),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !auth.isAuthenticated()) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
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
