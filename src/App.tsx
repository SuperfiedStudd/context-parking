import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useCallback } from "react";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import DraftDetail from "./pages/DraftDetail";
import Capture from "./pages/Capture";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SetupWizardModal from "./components/SetupWizardModal";
import SetupBanner from "./components/SetupBanner";
import { isSetupComplete, isSetupSkipped, getConfig } from "./lib/configStore";

const queryClient = new QueryClient();

const App = () => {
  const [setupDone, setSetupDone] = useState(isSetupComplete());
  const [setupSkipped, setSetupSkippedState] = useState(isSetupSkipped());
  const [wizardOpen, setWizardOpen] = useState(false);

  const needsWizard = !setupDone && !setupSkipped;

  const handleWizardComplete = useCallback(() => {
    setSetupDone(isSetupComplete());
    setSetupSkippedState(isSetupSkipped());
    setWizardOpen(false);
  }, []);

  const openWizard = useCallback(() => {
    setWizardOpen(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {/* First-run gating modal */}
        <SetupWizardModal
          open={needsWizard || wizardOpen}
          onComplete={handleWizardComplete}
          initialConfig={getConfig()}
        />

        <BrowserRouter>
          {/* Persistent banner when setup was skipped */}
          {setupSkipped && !setupDone && (
            <div className="px-4 pt-3">
              <SetupBanner onOpenWizard={openWizard} />
            </div>
          )}
          <Routes>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/drafts/:id" element={<DraftDetail />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/settings" element={<SettingsPage onOpenWizard={openWizard} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
