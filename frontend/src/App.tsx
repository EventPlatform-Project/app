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
import TicketsPage from '@/pages/tickets/TicketsPage' 

import ProfilePage from '@/pages/profile/ProfilePage'
import AdminPage from '@/pages/admin/AdminPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import FeedbackPage from '@/pages/feedback/FeedbackPage'
import ForbiddenPage from '@/pages/ForbiddenPage'

// Utility template pages
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { HelpPage } from '@/pages/help/HelpPage'
import { ComponentsPage } from '@/pages/components/ComponentsPage'

export default function App() {
  return (
    <Routes>
      {/* 1. Routes d'authentification (Sans sidebar, publiques) */}
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* 2. Routes de l'application (Avec sidebar, PROTÉGÉES par Keycloak) */}
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
        
        {/* On met les Réservations et les Tickets ici car ils ont besoin de l'ID utilisateur */}
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Accès Admin uniquement */}
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

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Route>
    </Routes>
  )
}