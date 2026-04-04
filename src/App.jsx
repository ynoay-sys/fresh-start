import { Toaster } from "@/components/ui/toaster"
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
import LandingPageBuilder from './pages/LandingPageBuilder';
import Orders from './pages/Orders';
import PublicLandingPage from './pages/PublicLandingPage';
import Pricing from './pages/Pricing';
import AutomationTest from './pages/admin/AutomationTest';
import Billing from './pages/Billing';

function ComingSoon({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] flex-col gap-3" dir="rtl">
      <div className="text-4xl">🚧</div>
      <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
      <p className="text-sm text-gray-400">עמוד זה יהיה זמין בקרוב</p>
    </div>
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
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/business-opening" element={<BusinessOpening />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/upload" element={<DocumentUpload />} />
        <Route path="/documents/templates" element={<DocumentTemplatesPage />} />
        <Route path="/documents/sign/create" element={<SignatureCreate />} />
        <Route path="/documents/sign/:documentId" element={<DocumentSign />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/vision" element={<Vision />} />
        <Route path="/landing-page" element={<LandingPageBuilder />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<ComingSoon title="הגדרות" />} />
        <Route path="/schema" element={<SchemaDocumentation />} />
      </Route>
      <Route path="/p/:subdomain" element={<PublicLandingPage />} />
      <Route path="/admin/automation-test" element={<AutomationTest />} />
        <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;