'use client'
import { motion } from 'framer-motion'

type Props = {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'scale'
}

const variants = {
  up:    { hidden: { opacity: 0, y: 32 },       visible: { opacity: 1, y: 0 } },
  left:  { hidden: { opacity: 0, x: -32 },      visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 32 },       visible: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } },
}

export function MotionSection({ children, className = '', delay = 0, direction = 'up' }: Props) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.15 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: delay / 1000 }}
      variants={variants[direction]}
    >
      {children}
    </motion.div>
  )
}
