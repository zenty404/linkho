'use client'

import { createContext, useContext, type RefObject } from 'react'

// Permet à DashboardIntro de mesurer la position exacte du logo dans la sidebar
// (fourni par AppSidebar) pour y faire glisser le logo centré de l'écran d'intro.
export const IntroLogoTargetContext = createContext<RefObject<HTMLDivElement | null> | null>(null)

export function useIntroLogoTargetRef() {
  return useContext(IntroLogoTargetContext)
}
