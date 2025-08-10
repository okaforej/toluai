import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/LoginPage';
import IRPADashboardPage from './pages/IRPADashboardPage';
import CompaniesPage from './pages/CompaniesPage';
import UsersPage from './pages/UsersPage';
import InsuredEntitiesPage from './pages/InsuredEntitiesPage';
import InsuredEntitiesSplitView from './pages/InsuredEntitiesSplitView';
import RiskAssessmentsPage from './pages/RiskAssessmentsPage';
import CybersecurityPage from './pages/ExternalRisk/CybersecurityPage';
import SettingsPage from './pages/SettingsPage';
import RoleManagementPage from './pages/Admin/RoleManagementPage';
import RuleManagementPage from './pages/Admin/RuleManagementPage';
import ReferenceDataPage from './pages/ReferenceDataPage';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route wrapper (redirects to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<IRPADashboardPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="insured-entities" element={<InsuredEntitiesSplitView />} />
        {/* AI: IGNORE - Risk Assessments page temporarily hidden */}
        {/* <Route path="risk-assessments" element={<RiskAssessmentsPage />} /> */}
        {/* AI: IGNORE - External Risk Signals routes temporarily hidden */}
        {/* <Route path="external-risk/cybersecurity" element={<CybersecurityPage />} /> */}
        {/* <Route path="external-risk/regulatory" element={<CybersecurityPage />} /> */}
        {/* <Route path="external-risk/market" element={<CybersecurityPage />} /> */}
        <Route path="reference-data/industry-types" element={<SettingsPage />} />
        <Route path="reference-data/states" element={<SettingsPage />} />
        <Route path="reference-data/education-levels" element={<SettingsPage />} />
        <Route path="reference-data/job-titles" element={<SettingsPage />} />
        <Route path="reference-data/practice-fields" element={<SettingsPage />} />
        <Route path="reference-data/roles-permissions" element={<SettingsPage />} />
        {/* AI: IGNORE - Audit & Logs routes temporarily hidden */}
        {/* <Route path="audit/user-activity" element={<SettingsPage />} /> */}
        {/* <Route path="audit/data-access" element={<SettingsPage />} /> */}
        {/* <Route path="audit/api-usage" element={<SettingsPage />} /> */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin/roles" element={<RoleManagementPage />} />
        <Route path="admin/rules" element={<RuleManagementPage />} />
        <Route path="reference-data" element={<ReferenceDataPage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow:
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
