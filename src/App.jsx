import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { Layout } from "./components/Layout.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { CertificationsPage } from "./pages/CertificationsPage.jsx";
import { EnrollmentsPage } from "./pages/EnrollmentsPage.jsx";
import { NotificationsPage } from "./pages/NotificationsPage.jsx";
import { VouchersPage } from "./pages/VouchersPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { LearningPage } from "./pages/LearningPage.jsx";
import { CardSkeleton } from "./components/Skeleton.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8" style={{ backgroundColor: "var(--color-bg-body)" }}>
        <div className="w-full max-w-md space-y-4">
          <CardSkeleton />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="certifications" element={<CertificationsPage />} />
        <Route path="enrollments" element={<EnrollmentsPage />} />
        <Route path="learning/:id" element={<LearningPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="vouchers" element={<VouchersPage />} />
                <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
