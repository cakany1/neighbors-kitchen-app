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
import { InstallPrompt } from "./components/InstallPrompt";
import { CookieBanner } from "./components/CookieBanner";
import { OnboardingTour } from "./components/OnboardingTour";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAnalyticsTracking } from "./hooks/useAnalyticsTracking";
import { useState } from "react";

const queryClient = new QueryClient();

// Inner component that uses router hooks
const AppRoutes = () => {
  const [showTour, setShowTour] = useState(false); // Disabled by default
  const location = useLocation();
  
  // Initialize analytics tracking
  useAnalyticsTracking();

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

  return (
    <>
      <Toaster />
      <Sonner />
      <InstallPrompt />
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
