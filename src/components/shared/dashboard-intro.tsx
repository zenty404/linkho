'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { StartupLoader } from './startup-loader'
import { LoaderProvider, useLoader } from './loader-context'

function DashboardIntroInner({ children }: { children: React.ReactNode }) {
  const { isLoaderFinished: loaderFinished } = useLoader()

  return (
    <>
      {/* Contenu toujours visible derrière */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>

      {/* Loader par dessus qui glisse vers le haut */}
      <AnimatePresence>
        {!loaderFinished && (
          <StartupLoader logoSrc="/SOUS LOGO V2.svg" logoAlt="LINKHO" duration={2500} />
        )}
      </AnimatePresence>
    </>
  )
}

export function DashboardIntro({ children }: { children: React.ReactNode }) {
  return (
    <LoaderProvider>
      <DashboardIntroInner>{children}</DashboardIntroInner>
    </LoaderProvider>
  )
}
