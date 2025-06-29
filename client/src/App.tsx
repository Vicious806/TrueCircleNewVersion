import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import Auth from "@/pages/auth";
import Matches from "@/pages/matches";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import WelcomeSurvey from "@/components/WelcomeSurvey";
import type { User } from "@shared/schema";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Check if authenticated user needs to take the survey
  if (isAuthenticated && user) {
    const userData = user as User;
    if (!userData.hasTakenSurvey) {
      return <WelcomeSurvey onComplete={() => {
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        window.location.reload();
      }} />;
    }
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={Auth} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/matches" component={Matches} />
          <Route path="/chat/:id?" component={Chat} />
          <Route path="/chat" component={Chat} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
        </>
      )}
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
