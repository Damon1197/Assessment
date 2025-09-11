import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import SuperAdminDashboard from "@/pages/dashboard/super-admin";
import SMEDashboard from "@/pages/dashboard/sme";
import ManagerDashboard from "@/pages/dashboard/manager";
import CandidateDashboard from "@/pages/dashboard/candidate";
import QuestionBank from "@/pages/question-bank";
import Assessments from "@/pages/assessments";
import AssessmentExecution from "@/pages/assessment-execution";
import UserManagement from "@/pages/user-management";
import Analytics from "@/pages/analytics";
import CodeEditorPage from "@/pages/code-editor";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={() => {
            switch (user?.role) {
              case 'super_admin':
                return <SuperAdminDashboard />;
              case 'sme':
                return <SMEDashboard />;
              case 'manager_hr':
                return <ManagerDashboard />;
              case 'candidate':
                return <CandidateDashboard />;
              default:
                return <CandidateDashboard />;
            }
          }} />
          <Route path="/question-bank" component={QuestionBank} />
          <Route path="/assessments" component={Assessments} />
          <Route path="/assessment/:id" component={AssessmentExecution} />
          <Route path="/users" component={UserManagement} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/code-editor" component={CodeEditorPage} />
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
