'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { StartupLoader } from '@/components/shared/startup-loader'
import { LoaderProvider, useLoader } from '@/components/shared/loader-context'

function PublicLoaderInner({ children }: { children: React.ReactNode }) {
  const { isLoaderFinished: loaderFinished } = useLoader()
  const [shouldPlay, setShouldPlay] = useState<boolean | null>(null)

  useEffect(() => {
    const visited = sessionStorage.getItem('linkho_public_visited')
    if (!visited) {
      sessionStorage.setItem('linkho_public_visited', '1')
      setShouldPlay(true)
    } else {
      setShouldPlay(false)
    }
  }, [])

  if (shouldPlay === null) return null

  return (
    <>
      {children}
      <AnimatePresence>
        {shouldPlay && !loaderFinished && (
          <StartupLoader
            logoSrc="/SOUS LOGO V2.svg"
            logoAlt="LINKHO"
            duration={2000}
            storageKey="linkho_public_visited"
          />
        )}
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
