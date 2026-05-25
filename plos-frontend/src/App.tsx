import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import TodayPage from './pages/TodayPage';
import DashboardPage from './pages/DashboardPage';
import ResponsibilitiesPage from './pages/ResponsibilitiesPage';
import ResponsibilityDetailPage from './pages/ResponsibilityDetailPage';
import FinancePage from './pages/FinancePage';
import HealthPage from './pages/HealthPage';
import HabitsPage from './pages/HabitsPage';
import TimelinePage from './pages/TimelinePage';
import PeoplePage from './pages/PeoplePage';
import PersonDetailPage from './pages/PersonDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/register"         element={<RegisterPage />} />
      <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
      <Route path="/reset-password"   element={<ResetPasswordPage />} />
      <Route path="/verify-email"     element={<VerifyEmailPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/"                 element={<TodayPage />} />
                <Route path="/insights"         element={<DashboardPage />} />
                <Route path="/responsibilities"     element={<ResponsibilitiesPage />} />
                <Route path="/responsibilities/:id" element={<ResponsibilityDetailPage />} />
                <Route path="/people"           element={<PeoplePage />} />
                <Route path="/people/:id"       element={<PersonDetailPage />} />
                <Route path="/finance"          element={<FinancePage />} />
                <Route path="/health"           element={<HealthPage />} />
                <Route path="/habits"           element={<HabitsPage />} />
                <Route path="/timeline"         element={<TimelinePage />} />
                <Route path="/notifications"   element={<NotificationsPage />} />
                <Route path="/settings"         element={<SettingsPage />} />
                <Route path="*"                 element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
