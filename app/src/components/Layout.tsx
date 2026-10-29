import { Outlet, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'
import Footer from './Footer'

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, delay: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex min-h-[100dvh]">
      <Navbar />
      <div className="flex flex-1 flex-col md:ml-16">
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </div>
  )
}
