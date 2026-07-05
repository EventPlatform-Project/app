import { AnimatePresence, motion } from 'framer-motion'
import { UserPlus, X } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

/**
 * Small fixed-position toast rendered when a new SSE notification arrives.
 * Positioned bottom-right so it doesn't clash with the Topbar bell dropdown.
 */
export function NotificationToast() {
  const { toast, dismissToast } = useNotifications()

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-[100] w-80 bg-orbit-surface2 border border-orbit-border rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-orbit-primary/15 text-orbit-primary flex items-center justify-center">
              <UserPlus className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-200">New user</p>
              <p className="text-sm text-slate-300 truncate">{toast.message}</p>
              {toast.email && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">{toast.email}</p>
              )}
            </div>
            <button
              onClick={dismissToast}
              className="text-slate-500 hover:text-slate-300 -mr-1 -mt-1 p-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
