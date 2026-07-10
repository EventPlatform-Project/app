import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/auth/ProtectedRoute'

// Auth pages
import { SignInPage } from '@/pages/auth/SignInPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'

// App pages
import WelcomePage from '@/pages/WelcomePage'
import EventsPage from '@/pages/events/EventsPage'
import ReservationsPage from '@/pages/reservations/ReservationsPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import AdminPage from '@/pages/admin/AdminPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import ForbiddenPage from '@/pages/ForbiddenPage'

// Utility template pages
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { HelpPage } from '@/pages/help/HelpPage'
import { ComponentsPage } from '@/pages/components/ComponentsPage'

export default function App() {
  return (
    <Routes>
      {/* 1. Authentication routes — no sidebar, public */}
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* 2. Public application routes — with sidebar, no Keycloak auth required */}
      <Route element={<Layout />}>
        <Route path="/reservations" element={<ReservationsPage />} />
      </Route>

      {/* 3. Application routes — with sidebar, protected by Keycloak */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Requires authentication only */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin-only: enforced by role + backend @PreAuthorize */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMINISTRATEUR']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/components" element={<ComponentsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Route>
    </Routes>
  )
}
