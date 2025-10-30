import { Switch, Route, useLocation, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import GeographicAnalysis from "@/pages/geographic-analysis";
import Timeline from "@/pages/timeline";
import Comparison from "@/pages/comparison";
import RawData from "@/pages/raw-data";
import Evaluation from "@/pages/evaluation";
import RealTime from "@/pages/real-time";
import NewsMonitoring from "@/pages/news-monitoring";
import About from "@/pages/about";
import AdminRedirect from "@/pages/admin";
import ManageUsers from "@/pages/admin/manage-users";
import Login from "@/pages/auth/login";
// Direct upload page removed as requested
import { DisasterContextProvider } from "@/context/disaster-context";
import { TutorialProvider } from "@/context/tutorial-context";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { MainLayout } from "@/components/layout/main-layout";
import { UploadProgressModal } from "@/components/upload-progress-modal";
import { UsernameDisplayFix } from "@/components/layout/username-fix";
import { useEffect } from "react";

// Simple component to directly render dashboard routes without protection
// We'll handle all auth checking in the login page
const SimpleRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) => {
  return <Route {...rest} component={Component} />;
};

function Router() {
  const [location] = useLocation();
  const isLandingPage = location === "/";
  
  // Return early for landing page without MainLayout
  if (isLandingPage || location === '/admin-login') {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/about" component={About} />
        <Route path="/admin-login" component={Login} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // Regular dashboard routes with MainLayout - no protection for now to fix login issues
  return (
    <MainLayout>
      <Switch>
        <SimpleRoute path="/dashboard" component={Dashboard} />
        <SimpleRoute path="/geographic-analysis" component={GeographicAnalysis} />
        {/* Keep the old route for backward compatibility */}
        <SimpleRoute path="/emotion-analysis" component={GeographicAnalysis} />
        <SimpleRoute path="/timeline" component={Timeline} />
        <SimpleRoute path="/comparison" component={Comparison} />
        <SimpleRoute path="/raw-data" component={RawData} />
        <SimpleRoute path="/evaluation" component={Evaluation} />
        <SimpleRoute path="/real-time" component={RealTime} />
        <SimpleRoute path="/news-monitoring" component={NewsMonitoring} />

        <SimpleRoute path="/admin" component={AdminRedirect} />
        <SimpleRoute path="/admin/manage-users" component={ManageUsers} />
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TutorialProvider>
          <DisasterContextProvider>
            {/* Global upload progress modal to ensure it stays visible across all pages */}
            <UploadProgressModal />
            <UsernameDisplayFix />
            <Router />
            <Toaster />
          </DisasterContextProvider>
        </TutorialProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;