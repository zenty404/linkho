'use client'
import { useInView } from '@/hooks/use-in-view'

type Props = {
  children: React.ReactNode
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn'
  delay?: number
  className?: string
}

export function AnimateIn({ children, animation = 'fadeInUp', delay = 0, className = '' }: Props) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{
        opacity: inView ? undefined : 0,
        animation: inView ? `${animation} 0.6s ease forwards ${delay}ms` : 'none',
      }}
    >
      {children}
    </div>
  )
}
