import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import MapView from "./pages/MapView";
import AddMeal from "./pages/AddMeal";
import Profile from "./pages/Profile";
import MealDetail from "./pages/MealDetail";
import Payment from "./pages/Payment";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Impressum from "./pages/Impressum";
import AGB from "./pages/AGB";
import { Footer } from "./components/Footer";
import { InstallPrompt } from "./components/InstallPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InstallPrompt />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen pb-24">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/add-meal" element={<AddMeal />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/meal/:id" element={<MealDetail />} />
            <Route path="/payment/:id" element={<Payment />} />
            <Route path="/chat/:bookingId" element={<Chat />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/agb" element={<AGB />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
