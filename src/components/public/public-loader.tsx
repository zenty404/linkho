'use client'

import { AnimatePresence } from 'framer-motion'
import { StartupLoader } from '@/components/shared/startup-loader'
import { LoaderProvider } from '@/components/shared/loader-context'

function PublicLoaderInner({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AnimatePresence>
        <StartupLoader
          logoSrc="/SOUS LOGO V2.svg"
          logoAlt="LINKHO"
          duration={2000}
        />
      </AnimatePresence>
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
