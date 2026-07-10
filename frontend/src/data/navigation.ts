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
      { label: 'Événements(feten)', icon: Calendar, href: '/events' },
      { label: 'Réservations(farah)', icon: ClipboardList, href: '/reservations' },
      { label: 'Tickets (emna)', icon: Ticket, href: '/tickets' },
    ],
  },
    {
    title: 'Utilisateur',
    items: [
      { label: 'Mon Profil(bedis)', icon: User, href: '/profile' },
      { label: 'Feedback (Rawen)', icon: Star, href: '/feedback' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Panel Admin(bedis)', icon: ShieldCheck, href: '/admin' },
      { label: 'Paramètres', icon: Settings, href: '/settings' },
      { label: 'Aide', icon: HelpCircle, href: '/help' },
    ],
  },
  {
    title: 'Design System',
    items: [
      { label: 'Components', icon: Puzzle, href: '/components' },
      { label: 'Settings', icon: Settings, href: '/settings' },
      { label: 'Help', icon: HelpCircle, href: '/help' },
    ],
  },
]
