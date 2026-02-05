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
import NotFound from "./pages/NotFound";
import Impressum from "./pages/Impressum";
import AGB from "./pages/AGB";
import FAQ from "./pages/FAQ";
import Install from "./pages/Install";
import Contact from "./pages/Contact";
import Story from "./pages/Story";
import OAuthCallback from "./pages/OAuthCallback";
import { InstallPrompt } from "./components/InstallPrompt";
import { CookieBanner } from "./components/CookieBanner";
import { OnboardingTour } from "./components/OnboardingTour";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAnalyticsTracking } from "./hooks/useAnalyticsTracking";
import { useState, useEffect } from "react";

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
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/add-meal" element={<AddMeal />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:chefId" element={<ChefProfile />} />
          <Route path="/meal/:id" element={<MealDetail />} />
          <Route path="/payment/:id" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/chat/:bookingId" element={<Chat />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/agb" element={<AGB />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/install" element={<Install />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/story" element={<Story />} />
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
