'use client'

import { motion } from 'framer-motion'

type Props = {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function FadeUp({ children, className, delay = 0 }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  )
}
