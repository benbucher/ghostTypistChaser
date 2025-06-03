/**
 * Main application component that sets up the core providers and routing structure.
 * This file serves as the root component of the application.
 */

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import GamePage from "@/pages/GamePage";

/**
 * Router component that handles application routing using wouter.
 * Defines the main routes of the application:
 * - "/" -> GamePage (main game interface)
 * - Any other route -> NotFound page
 */
function Router() {
  return (
    <Switch>
      <Route path="/" component={GamePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Root App component that wraps the application with necessary providers:
 * - QueryClientProvider: For managing server state and data fetching
 * - TooltipProvider: For tooltip functionality across the app
 * - Toaster: For displaying notifications
 */
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
