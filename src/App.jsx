import { Toaster } from "@/components/ui/toaster"
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import Documents from './pages/Documents';
import DocumentUpload from './pages/DocumentUpload';
import SignatureCreate from './pages/SignatureCreate';
import DocumentSign from './pages/DocumentSign';
import SchemaDocumentation from './pages/SchemaDocumentation';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import BusinessOpening from './pages/BusinessOpening';
import Progress from './pages/Progress';
import Clients from './pages/Clients';
import Schedule from './pages/Schedule';
import Notifications from './pages/Notifications';
import Vision from './pages/Vision';
import DocumentTemplatesPage from './pages/DocumentTemplatesPage';
const LandingPageBuilder = lazy(() => import('./pages/LandingPageBuilder'));
import Orders from './pages/Orders';
import PublicLandingPage from './pages/PublicLandingPage';
import Pricing from './pages/Pricing';
import AutomationTest from './pages/admin/AutomationTest';
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'));
import LaunchChecklist from './pages/admin/LaunchChecklist';
import AdminUsers from './pages/admin/AdminUsers';
import AdminContent from './pages/admin/AdminContent';
import AdminRoute from './components/AdminRoute';
import Marketing from './pages/Marketing';
import Register from './pages/Register';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Help from './pages/Help';
const EmailSignaturePage = lazy(() => import('./pages/EmailSignaturePage'));
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function ComingSoon({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] flex-col gap-3" dir="rtl">
      <div className="text-4xl">🚧</div>
      <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
      <p className="text-sm text-gray-400">עמוד זה יהיה זמין בקרוב</p>
    </div>
  );
}

// Public routes — always render regardless of auth state
function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Marketing />} />
      <Route path="/marketing" element={<Marketing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/help" element={<Help />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/p/:subdomain" element={<PublicLandingPage />} />
      <Route path="*" element={<Marketing />} />
    </Routes>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') {
      return <PublicRoutes />;
    }
  }

  return (
    <Routes>
      {/* Public routes accessible when logged in too */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/marketing" element={<Marketing />} />
      <Route path="/register" element={<Navigate to="/dashboard" replace />} />
      <Route path="/help" element={<Help />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/p/:subdomain" element={<PublicLandingPage />} />

      {/* Authenticated app routes */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/business-opening" element={<BusinessOpening />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/upload" element={<DocumentUpload />} />
        <Route path="/documents/templates" element={<DocumentTemplatesPage />} />
        <Route path="/documents/sign/create" element={<SignatureCreate />} />
        <Route path="/documents/email-signature" element={<Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'60vh'}}><div>טוען...</div></div>}><EmailSignaturePage /></Suspense>} />
        <Route path="/documents/sign/:documentId" element={<DocumentSign />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/vision" element={<Vision />} />
        <Route path="/landing-page" element={<Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'60vh'}}><div>טוען...</div></div>}><LandingPageBuilder /></Suspense>} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/schema" element={<SchemaDocumentation />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/automation-test" element={<AdminRoute><AutomationTest /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'60vh'}}><div>טוען...</div></div>}><AnalyticsDashboard /></Suspense></AdminRoute>} />
      <Route path="/admin/launch-checklist" element={<AdminRoute><LaunchChecklist /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;