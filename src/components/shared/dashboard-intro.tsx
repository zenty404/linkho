'use client'

import { useEffect, useState } from 'react'
import { StartupLoader } from './startup-loader'
import { LoaderProvider, useLoader } from './loader-context'

function DashboardIntroInner({ children }: { children: React.ReactNode }) {
  const { isLoaderFinished: loaderFinished } = useLoader()
  const [shouldPlay, setShouldPlay] = useState<boolean | null>(null)

  useEffect(() => {
    const played = sessionStorage.getItem('hasVisited')
    setShouldPlay(!played)
  }, [])

  if (shouldPlay === null) return null

  return (
    <>
      {shouldPlay && !loaderFinished && (
        <StartupLoader
          logoSrc="/SOUS LOGO V2.svg"
          logoAlt="LINKHO"
          duration={2500}
        />
      )}
      {(!shouldPlay || loaderFinished) && children}
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
