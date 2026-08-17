'use client'

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion, useAnimate } from 'framer-motion'
import Image from 'next/image'
import { IntroLogoTargetContext } from './intro-logo-context'

const STORAGE_KEY = 'linkho_intro_played'

// Timings de l'intro :
// - DELAY_START : le logo attend, centré, avant de commencer à glisser vers la sidebar
// - TRAVEL_DURATION : durée du glissement centre -> sidebar
const DELAY_START = 1.6
const TRAVEL_DURATION = 0.9
const EXIT_FADE_DURATION = 0.3 // durée du fondu de sortie de l'overlay (doit matcher le `transition` de son exit)

const LOGO_WIDTH = 260
const LOGO_RATIO = 248.66 / 1254.2 // viewBox du logo LINKHO

// Correction fine : ajuster entre 4 et 16px si le logo n'atterrit pas exactement
// sur le logo de la sidebar (décalage dû aux marges/bordures autour de la cible mesurée).
const LANDING_OFFSET_Y = 8

// Pendant l'animation, le logo de la sidebar reste caché (opacity-0) pour qu'un seul
// logo soit visible à l'écran : celui qui glisse depuis le centre.
const IntroContext = createContext({ isAnimating: false })
export function useIntro() {
  return useContext(IntroContext)
}

function subscribe() {
  return () => {}
}

function getSnapshot() {
  return sessionStorage.getItem(STORAGE_KEY) === '1'
}

function getServerSnapshot() {
  return null
}

export function DashboardIntro({ children }: { children: React.ReactNode }) {
  // null tant que le client n'a pas encore lu sessionStorage (évite un mismatch d'hydratation)
  const alreadyPlayed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const shouldPlay = alreadyPlayed === false

  const [scope, animate] = useAnimate<HTMLDivElement>()
  const targetRef = useRef<HTMLDivElement>(null)

  const [overlayVisible, setOverlayVisible] = useState(true)
  const [layoutVisible, setLayoutVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    if (!shouldPlay) return

    let cancelled = false
    let revealTimer: ReturnType<typeof setTimeout> | undefined

    const startTimer = setTimeout(() => {
      if (cancelled) return
      // Le layout (sidebar + contenu) apparaît au même instant que le logo commence à glisser
      setLayoutVisible(true)

      void (async () => {
        if (!scope.current || !targetRef.current) return
        const endRect = targetRef.current.getBoundingClientRect()

        // Le logo reste pleinement visible pendant tout le trajet — aucun fondu ici.
        // Le fondu de sortie est géré par l'exit du motion.div wrapper (AnimatePresence),
        // pas sur le logo individuellement.
        await animate(
          scope.current,
          {
            top: endRect.top - LANDING_OFFSET_Y,
            left: endRect.left,
            width: endRect.width,
            height: endRect.height,
          },
          { duration: TRAVEL_DURATION, ease: [0.4, 0, 0.2, 1] }
        )

        if (cancelled) return
        sessionStorage.setItem(STORAGE_KEY, '1')
        setOverlayVisible(false)

        // On attend explicitement la fin complète du fondu de sortie de l'overlay avant
        // de révéler le logo de la sidebar. Si isAnimating passait à false plus tôt, les
        // deux logos se chevaucheraient pendant le fondu de l'overlay → effet de "pop".
        revealTimer = setTimeout(() => {
          if (!cancelled) setIsAnimating(false)
        }, EXIT_FADE_DURATION * 1000)
      })()
    }, DELAY_START * 1000)

    return () => {
      cancelled = true
      clearTimeout(startTimer)
      clearTimeout(revealTimer)
    }
  }, [shouldPlay, animate, scope])

  if (alreadyPlayed === null) return null

  if (!shouldPlay) {
    return (
      <IntroContext.Provider value={{ isAnimating: false }}>
        <IntroLogoTargetContext.Provider value={targetRef}>{children}</IntroLogoTargetContext.Provider>
      </IntroContext.Provider>
    )
  }

  const centerTop = window.innerHeight / 2 - (LOGO_WIDTH * LOGO_RATIO) / 2
  const centerLeft = window.innerWidth / 2 - LOGO_WIDTH / 2

  return (
    <IntroContext.Provider value={{ isAnimating }}>
      <IntroLogoTargetContext.Provider value={targetRef}>
        {/* Layout complet (sidebar + contenu) : un seul bloc, cache tout jusqu'à DELAY_START puis
            apparaît d'un coup. Pas de `flex` ici — un enfant flex sans flex-grow ne s'étire pas sur
            toute la largeur, ce qui laissait un espace vide à droite pendant l'animation. */}
        <motion.div
          className="relative h-screen w-full overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={layoutVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        >
          {children}
        </motion.div>

        {/* Logo centré qui glisse jusqu'à sa position exacte dans la sidebar (FLIP manuel).
            Le logo lui-même n'a pas d'opacity animée : seul le wrapper entier fait un
            fondu de sortie (exit), une fois arrivé, via AnimatePresence. */}
        <AnimatePresence>
          {overlayVisible && (
            <motion.div
              key="intro-logo"
              ref={scope}
              exit={{ opacity: 0 }}
              transition={{ duration: EXIT_FADE_DURATION, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: centerTop,
                left: centerLeft,
                width: LOGO_WIDTH,
                height: LOGO_WIDTH * LOGO_RATIO,
                zIndex: 100,
              }}
            >
              {/* Version navy + orange : seul logo affiché pendant l'animation, lisible sur fond blanc */}
              <Image src="/LOGO PRINCIPAL.svg" alt="LINKHO" fill priority className="object-contain" />
            </motion.div>
          )}
        </AnimatePresence>
      </IntroLogoTargetContext.Provider>
    </IntroContext.Provider>
  )
}
