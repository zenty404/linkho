'use client'

import { useEffect } from 'react'
// import { AnimatePresence } from 'framer-motion'
// import { StartupLoader } from '@/components/shared/startup-loader'
import { LoaderProvider, useLoader } from '@/components/shared/loader-context'

// Loader désactivé temporairement sur la home (perte de temps pendant les tests).
// Le loader du dashboard (dashboard-intro.tsx) n'est PAS affecté.
// Pour réactiver : supprimer ce bloc useEffect + décommenter l'AnimatePresence/StartupLoader
// ci-dessous, et re-commenter/supprimer le useEffect.
function PublicLoaderInner({ children }: { children: React.ReactNode }) {
  const { setLoaderFinished } = useLoader()

  useEffect(() => {
    setLoaderFinished(true)
  }, [setLoaderFinished])

  return (
    <>
      {children}
      {/*
      <AnimatePresence>
        <StartupLoader
          logoSrc="/SOUS LOGO V2.svg"
          logoAlt="LINKHO"
          duration={2000}
        />
      </AnimatePresence>
      */}
    </>
  )
}

export function PublicLoader({ children }: { children: React.ReactNode }) {
  return (
    <LoaderProvider>
      <PublicLoaderInner>{children}</PublicLoaderInner>
    </LoaderProvider>
  )
}
