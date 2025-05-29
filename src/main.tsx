// start the app always with '/' route
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./components/layout/theme-provider";
import Index from "./pages";
import LoginForm from "./pages/login";
import SignupForm from "./pages/signup";
import Logout from "./pages/logout";
import { OAuthApprovalDialog } from "./components/auth/oauth-approval-dialog";

import "./index.css";
import { OAuthCallback } from "./components/auth/oauth-callback";
import { ProtectedRoute } from "./components/auth/route-components";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/' Component={Index} />
            <Route path='/login' Component={LoginForm} />
            <Route path='/authorize' Component={LoginForm} />
            <Route path='/signup' Component={SignupForm} />
            <Route path='/logout' Component={Logout} />
            <Route path='/api/fine/mcp/authorize' element={<ProtectedRoute Component={OAuthApprovalDialog} />} />
            <Route path='/api/fine/mcp/callback/:provider' Component={OAuthCallback} />
          </Routes>
        </BrowserRouter>
        <Sonner />
        <Toaster />
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
