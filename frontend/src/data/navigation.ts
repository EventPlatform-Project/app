import {
  Home,
  Puzzle,
  Settings,
  HelpCircle,
  Calendar,
  ClipboardList,
  ShieldCheck,
  Star,
  Ticket,
  User,
  Bell,
} from 'lucide-react'
import type { NavSection } from '@/types'

export const navigation: NavSection[] = [
  {
    title: 'Général',
    items: [
      { label: 'Accueil', icon: Home, href: '/welcome' }, // <-- Ajoute cette ligne
      { label: 'Notifications', icon: Bell, href: '/notifications' },
    ],
  },
  {
    title: 'Gestion des Événements',
    items: [
      { label: 'Événements', icon: Calendar, href: '/events' },
      { label: 'Réservations', icon: ClipboardList, href: '/reservations' },
      { label: 'Tickets', icon: Ticket, href: '/tickets' },
    ],
  },
  {
    title: 'Utilisateur',
    items: [
      { label: 'Mon Profil', icon: User, href: '/profile' },
      { label: 'Feedback ', icon: Star, href: '/feedback' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Panel Admin', icon: ShieldCheck, href: '/admin' },
      { label: 'Paramètres', icon: Settings, href: '/settings' },
    ],
  },

]
