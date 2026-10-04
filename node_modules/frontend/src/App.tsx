import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RealtimeJobsProvider } from './context/RealtimeJobsContext';

// Common Components & Layouts
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';

// Public Pages
import LandingPage from './pages/LandingPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Studio Protected Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import AIStudioPage from './pages/studio/AIStudioPage';
import AssetLibraryPage from './pages/assets/AssetLibraryPage';
import ContentWorkspacePage from './pages/workspace/ContentWorkspacePage';
import ScriptToVideoPage from './pages/workspace/ScriptToVideoPage';
import VideoEditorPage from './pages/editor/VideoEditorPage';
import ClipGeneratorPage from './pages/clips/ClipGeneratorPage';
import PlatformAdaptationPage from './pages/adaptation/PlatformAdaptationPage';
import ContentCalendarPage from './pages/calendar/ContentCalendarPage';
import PublishingPage from './pages/publishing/PublishingPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import CreatorIntelligencePage from './pages/intelligence/CreatorIntelligencePage';
import SettingsPage from './pages/settings/SettingsPage';

// Create TanStack Query client with production defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <RealtimeJobsProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Landing Page */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<LandingPage />} />
                  </Route>

                  {/* Auth Flow */}
                  <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                  </Route>

                  {/* Studio Protected Routes */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/ai-studio" element={<AIStudioPage />} />
                    <Route path="/workspace" element={<ContentWorkspacePage />} />
                    <Route path="/projects/:id" element={<ContentWorkspacePage />} />
                    <Route path="/script-to-video" element={<ScriptToVideoPage />} />
                    <Route path="/editor" element={<VideoEditorPage />} />
                    <Route path="/clips" element={<ClipGeneratorPage />} />
                    <Route path="/assets" element={<AssetLibraryPage />} />
                    <Route path="/adaptation" element={<PlatformAdaptationPage />} />
                    <Route path="/calendar" element={<ContentCalendarPage />} />
                    <Route path="/publishing" element={<PublishingPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/intelligence" element={<CreatorIntelligencePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </RealtimeJobsProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
export default App;
