import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Footer } from './Footer'
import { NotificationToast } from '@/components/ui/NotificationToast'
import { SidebarContext, useSidebarState } from '@/hooks/useSidebar'

export function Layout() {
  const sidebarState = useSidebarState()
  const location = useLocation()

  return (
    <SidebarContext.Provider value={sidebarState}>
      <div className="flex h-screen bg-orbit-bg overflow-hidden">
        <div className="orbit-glow-bg" />

        <Sidebar />

        {/* Mobile overlay backdrop */}
        <AnimatePresence>
          {sidebarState.isMobile && sidebarState.mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-30"
              onClick={sidebarState.closeMobile}
            />
          )}
        </AnimatePresence>

        {/* Main content — no margin on mobile, sidebar-width margin on desktop */}
        <motion.div
          animate={{
            marginLeft: sidebarState.isMobile ? 0 : (sidebarState.collapsed ? 72 : 256),
          }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden"
        >
          <Topbar />

          {/* Each page manages its own padding and scroll */}
          <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-h-0 flex flex-col"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
            <Footer />
        </motion.div>

        {/* Live notification toast (bottom-right) */}
        <NotificationToast />
      </div>
    </SidebarContext.Provider>
  )
}
