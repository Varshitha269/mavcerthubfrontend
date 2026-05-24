import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { Layout } from "./components/Layout.jsx";
import { PublicLandingPage } from "./pages/PublicLandingPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { CertificationsPage } from "./pages/CertificationsPage.jsx";
import { EnrollmentsPage } from "./pages/EnrollmentsPage.jsx";
import { TasksPage } from "./pages/TasksPage.jsx";
import { UploadsPage } from "./pages/UploadsPage.jsx";
import { NotificationsPage } from "./pages/NotificationsPage.jsx";
import { VouchersPage } from "./pages/VouchersPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { LearningPage } from "./pages/LearningPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { RegistrationsPage } from "./pages/RegistrationsPage.jsx";
import { DrivesBrdAdminPage } from "./pages/DrivesBrdAdminPage.jsx";
import { RegistrationsAdminPage } from "./pages/RegistrationsAdminPage.jsx";
import { EligibilityApprovalsAdminPage } from "./pages/EligibilityApprovalsAdminPage.jsx";
import { ResultsAdminPage } from "./pages/ResultsAdminPage.jsx";
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
  if (!user) return <Navigate to="/welcome" replace />;
  return children;
}

function RoleHome() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? "/dashboard" : "/home"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<PublicLandingPage />} />
      <Route path="/login" element={<PublicLandingPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<RoleHome />} />
        <Route path="home" element={<HomePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="certifications" element={<CertificationsPage />} />
        <Route path="registrations" element={<RegistrationsPage />} />
        <Route path="enrollments" element={<EnrollmentsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="uploads" element={<UploadsPage />} />
        <Route path="learning/:id" element={<LearningPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="vouchers" element={<VouchersPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="admin-brd/drives" element={<DrivesBrdAdminPage />} />
        <Route path="admin-brd/registrations" element={<RegistrationsAdminPage />} />
        <Route path="admin-brd/eligibility" element={<EligibilityApprovalsAdminPage />} />
        <Route path="admin-brd/results" element={<ResultsAdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
