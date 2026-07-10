import { useEffect, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Sun, Moon, X, UserPlus, ArrowRight, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidebar } from '@/hooks/useSidebar'
import { useTheme } from '@/hooks/useTheme'
import { useNotifications, formatTimeAgo } from '@/hooks/useNotifications'
import { AccountPopover } from './AccountPopover'

// Mise à jour des labels pour ton projet EspritEvent
const routeLabels: Record<string, string> = {
  '/welcome': 'Accueil',
  '/events': 'Événements',
  '/reservations': 'Réservations',
  '/tickets': 'Tickets',
  '/notifications': 'Notifications',
  '/settings': 'Paramètres',
  '/help': 'Aide',
}

export function Topbar() {
  const { toggle: toggleSidebar } = useSidebar()
  const { theme, toggle: toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  // Live notifications (SSE stream from notification-service, fed by RabbitMQ)
  const { notifications, unreadCount, markAllRead, connected } = useNotifications()

  // Show the 5 most recent in the dropdown; the full list lives on /notifications
  const preview = notifications.slice(0, 5)

  // Close the dropdown when navigating away
  useEffect(() => {
    setShowNotifications(false)
  }, [location.pathname])

  // On récupère le titre de la page actuelle ou on met "Accueil" par défaut
  const pageTitle = routeLabels[location.pathname] ?? 'Accueil'

  return (
    <header className="h-16 border-b border-orbit-border bg-orbit-surface/80 backdrop-blur-xl flex items-center px-6 gap-4 flex-shrink-0 relative z-30">

      {/* BOUTON MENU MOBILE / COLLAPSE */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* SECTION LOGO ET TITRE (Nettoyée de "Dashboard") */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-white flex items-center justify-center p-1 shadow-sm border border-slate-700">
          <img
            src="/espritlogo.jpg"
            alt="Esprit"
            className="w-full h-full object-contain"
          />
        </div>

      <div className="flex items-center gap-2 text-sm ml-2">
        <span className="text-slate-100 font-bold tracking-tight text-lg">espritEvent</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-400 font-medium">{pageTitle}</span>
      </div>
      </div>

      {/* SECTION DROITE (Actions) */}
      <div className="ml-auto flex items-center gap-1">

        {/* RECHERCHE */}
        <button
          onClick={() => setShowSearch(true)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
        >
          <Search className="w-4.5 h-4.5" />
        </button>

        {/* NOTIFICATIONS */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(o => !o)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orbit-accent text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-orbit-surface">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-orbit-surface2 border border-orbit-border rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-orbit-border">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-200">Notifications</p>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-orbit-primary/20 text-orbit-primary-light px-1.5 py-0.5 rounded-full">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold ${
                        connected ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                      title={connected ? 'Connected to live stream' : 'Reconnecting…'}
                    >
                      {connected ? '● live' : '○ offline'}
                    </span>
                  </div>
                  <div className="divide-y divide-orbit-border text-left max-h-80 overflow-y-auto">
                    {preview.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        No notifications yet
                      </div>
                    )}
                    {preview.map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setShowNotifications(false)
                          navigate('/notifications')
                        }}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                          n.read ? '' : 'bg-orbit-primary/5'
                        }`}
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orbit-primary/15 text-orbit-primary flex items-center justify-center">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-200 truncate">{n.message}</p>
                          {n.email && (
                            <p className="text-xs text-slate-500 truncate">{n.email}</p>
                          )}
                          <p className="text-xs text-slate-600 mt-0.5">
                            {formatTimeAgo(n.createdAt)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Footer actions */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-orbit-border bg-orbit-surface3/30">
                    <button
                      type="button"
                      onClick={() => {
                        if (unreadCount > 0) markAllRead()
                      }}
                      disabled={unreadCount === 0}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false)
                        navigate('/notifications')
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-orbit-primary-light hover:text-orbit-primary px-2 py-1.5 rounded-md hover:bg-orbit-primary/10 transition-colors"
                    >
                      See all
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* THEME (JOUR/NUIT) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* ACCOUNT POPOVER */}
        <AccountPopover />
      </div>

      {/* MODAL DE RECHERCHE (Mise à jour avec tes liens) */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              className="w-full max-w-xl bg-orbit-surface2 border border-orbit-border rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-4 border-b border-orbit-border">
                <Search className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Rechercher un événement, un ticket..."
                  className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 outline-none text-sm"
                />
                <button onClick={() => setShowSearch(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-3">Accès Rapide</p>
                <div className="space-y-1">
                  {[
                    { label: 'Accueil', path: '/welcome' },
                    { label: 'Événements', path: '/events' },
                    { label: 'Réservations', path: '/reservations' },
                    { label: 'Tickets', path: '/tickets' },
                  ].map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowSearch(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <span className="text-sm text-slate-300">{item.label}</span>
                      <span className="ml-auto text-xs text-slate-600">{item.path}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
