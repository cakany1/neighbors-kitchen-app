import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import MapView from "./pages/MapView";
import AddMeal from "./pages/AddMeal";
import Profile from "./pages/Profile";
import ChefProfile from "./pages/ChefProfile";
import MealDetail from "./pages/MealDetail";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";
import Impressum from "./pages/Impressum";
import Privacy from "./pages/Privacy";
import AGB from "./pages/AGB";
import FAQ from "./pages/FAQ";
import Install from "./pages/Install";
import Contact from "./pages/Contact";
import Story from "./pages/Story";
import Trust from "./pages/Trust";
import Partnerships from "./pages/Partnerships";
import AdminHealth from "./pages/AdminHealth";
import AdminReleaseChecklist from "./pages/AdminReleaseChecklist";
import OAuthCallback from "./pages/OAuthCallback";
// PWA InstallPrompt removed for native store launch
import { CookieBanner } from "./components/CookieBanner";
import { OnboardingTour } from "./components/OnboardingTour";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAnalyticsTracking } from "./hooks/useAnalyticsTracking";
import { ScrollToTop } from "./components/ScrollToTop";
import { useState, useEffect } from "react";
import { detectEnvironment } from "@/utils/environment";

const queryClient = new QueryClient();

// Safety check state - defined outside component
let stagingMismatchError = false;

// Inner component that uses router hooks
const AppRoutes = () => {
  const [showTour, setShowTour] = useState(false); // Disabled by default
  const location = useLocation();
  
  // Initialize analytics tracking
  useAnalyticsTracking();

  // SAFETY GUARD: Verify staging environment is truly isolated (runs once on mount)
  useEffect(() => {
    const envInfo = detectEnvironment();
    const supabaseProjectId = envInfo.supabaseProjectId;
    
  // PROD Supabase ref (current production project)
    const prodRef = 'ziyocgrzijovpfhzutzs';

  // 1) If marked as staging but using PROD database -> block
    if (envInfo.environment === 'staging' && supabaseProjectId === prodRef) {
    console.error('[SAFETY GUARD] STAGING environment detected but using PRODUCTION database!');
    stagingMismatchError = true;
}

  // 2) If marked as production but NOT using PROD database -> block
    if (envInfo.environment === 'production' && supabaseProjectId && supabaseProjectId !== prodRef) {
    console.error('[SAFETY GUARD] PRODUCTION environment detected but NOT using PRODUCTION database!');
    stagingMismatchError = true;
}
, []);

  // TOUR LOGIC DISABLED FOR STABILITY
  // useEffect(() => {
  //   // Never show tour on landing page
  //   if (location.pathname === '/') {
  //     return;
  //   }
  //   
  //   // Check if user just registered or tour hasn't been completed
  //   const justRegistered = localStorage.getItem('just_registered') === 'true';
  //   const tourCompleted = localStorage.getItem('tour_completed') === 'true';
  //   
  //   if (justRegistered || !tourCompleted) {
  //     setShowTour(true);
  //     localStorage.removeItem('just_registered'); // Clear the flag
  //   }
  // }, [location.pathname]);

  // SAFETY ERROR DISPLAY: Show error if mismatch detected
  if (stagingMismatchError) {
    const env = detectEnvironment();
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md bg-card rounded-lg border-2 border-destructive p-6 space-y-4">
          <h1 className="text-2xl font-bold text-destructive">🚨 ENVIRONMENT MISMATCH</h1>
          <p className="text-destructive/90 font-mono text-sm">
            Staging environment detected but connected to PRODUCTION database (ziyocgrzijovpfhzutzs).
          </p>
          <p className="text-destructive/90 text-sm">
            This is a critical safety violation. All requests are BLOCKED.
          </p>
          <div className="bg-destructive/10 rounded p-3">
            <p className="text-xs text-destructive/80 font-mono">
              <strong>Hostname:</strong> {env.hostname}<br />
              <strong>Supabase Ref:</strong> {env.supabaseProjectId}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Contact your team lead. This staging instance must use a separate Supabase project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Toaster />
      <Sonner />
      {/* InstallPrompt removed for native store launch */}
      <CookieBanner />
      {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}
      <div className="relative z-0 flex flex-col min-h-screen pb-24">
        <Routes>
          {/* Public routes - no auth required */}
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<Navigate to="/feed" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/agb" element={<AGB />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/install" element={<Install />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/story" element={<Story />} />
          <Route path="/trust" element={<Trust />} />
          <Route path="/partnerships" element={<Partnerships />} />
          
          {/* Public but can view - no verification required for viewing */}
          <Route path="/feed" element={<Feed />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/meal/:id" element={<MealDetail />} />
          <Route path="/profile/:chefId" element={<ChefProfile />} />
          
          {/* Protected routes - require verified email */}
          <Route path="/add-meal" element={<ProtectedRoute><AddMeal /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/payment/:id" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/chat/:bookingId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/admin/health" element={<ProtectedRoute><AdminHealth /></ProtectedRoute>} />
          <Route path="/admin/release-checklist" element={<ProtectedRoute><AdminReleaseChecklist /></ProtectedRoute>} />
          
          {/* OAuth callback routes - handles both with and without tilde */}
          <Route path="/~oauth/callback" element={<OAuthCallback />} />
          <Route path="/%7Eoauth/callback" element={<OAuthCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
