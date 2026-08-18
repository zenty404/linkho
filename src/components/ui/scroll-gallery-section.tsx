'use client'

import { useRef, useState, useEffect } from 'react'

import { useScroll, motion, useTransform } from 'framer-motion'

import { MotionPreset } from '@/components/ui/motion-preset'

import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Reusable "images fly in from the hero and land into a grid on scroll"
// section. Adapted from a portfolio-grid component. Drop this directly
// below your <Hero /> section.
// ---------------------------------------------------------------------------

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-3 py-1 bg-brand/10 text-brand text-xs font-bold rounded-full ${className ?? ''}`}>{children}</span>
}

export type ScrollGalleryItem = {
  image: string
  tag: string
  titre: string
  description: string
}

type ScrollGallerySectionProps = {
  id?: string
  badge?: string
  titleLines?: string[] // rendered as stacked lines, e.g. ['Un lieu pour', 'chaque occasion']
  description?: string
  items: ScrollGalleryItem[] // exactly 4 items expected (2x2 grid), see notes below
}

// Custom hook to track window size
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

// Helper function to calculate responsive animation values.
// These are the "start" positions of each card (how far up/left/right they
// sit, as if still part of the hero above) before they animate down into
// their grid slot as the user scrolls the section into view.
function getAnimationValues(width: number) {
  if (width >= 1280) {
    return {
      div1TranslateY: '-880px',
      div1TranslateX: '520px',
      div2TranslateY: '-900px',
      div2TranslateX: '-30px',
      div3TranslateY: '-1440px',
      div3TranslateX: '520px',
      div4TranslateY: '-1460px',
      div4TranslateX: '-25px',
      textTranslateY: '-180px',
      textOpacity: 0,
      textScale: 0.75,
      divScale: 0.75
    }
  } else if (width >= 1024) {
    return {
      div1TranslateY: '-850px',
      div1TranslateX: '500px',
      div2TranslateY: '-860px',
      div2TranslateX: '-10px',
      div3TranslateY: '-1400px',
      div3TranslateX: '500px',
      div4TranslateY: '-1420px',
      div4TranslateX: '-10px',
      textTranslateY: '-180px',
      textOpacity: 0,
      textScale: 0.75,
      divScale: 0.75
    }
  } else if (width >= 945) {
    return {
      div1TranslateY: '-800px',
      div1TranslateX: '470px',
      div2TranslateY: '-820px',
      div2TranslateX: '-10px',
      div3TranslateY: '-1300px',
      div3TranslateX: '470px',
      div4TranslateY: '-1330px',
      div4TranslateX: '-10px',
      textTranslateY: '-180px',
      textOpacity: 0,
      textScale: 0.75,
      divScale: 0.75
    }
  } else if (width >= 884) {
    return {
      div1TranslateY: '-830px',
      div1TranslateX: '430px',
      div2TranslateY: '-840px',
      div2TranslateX: '-10px',
      div3TranslateY: '-1310px',
      div3TranslateX: '430px',
      div4TranslateY: '-1330px',
      div4TranslateX: '-10px',
      textTranslateY: '-180px',
      textOpacity: 0,
      textScale: 0.75,
      divScale: 0.75
    }
  } else if (width >= 768) {
    return {
      div1TranslateY: '-800px',
      div1TranslateX: '370px',
      div2TranslateY: '-820px',
      div2TranslateX: '-20px',
      div3TranslateY: '-1250px',
      div3TranslateX: '370px',
      div4TranslateY: '-1270px',
      div4TranslateX: '-25px',
      textTranslateY: '-180px',
      textOpacity: 0,
      textScale: 0.75,
      divScale: 0.75
    }
  } else {
    // Mobile - animation disabled, cards render statically in place
    return {
      div1TranslateY: '0px',
      div1TranslateX: '0px',
      div2TranslateY: '0px',
      div2TranslateX: '0px',
      div3TranslateY: '0px',
      div3TranslateX: '0px',
      div4TranslateY: '0px',
      div4TranslateX: '0px',
      textTranslateY: '0px',
      textOpacity: 1,
      textScale: 1,
      divScale: 1
    }
  }
}

const ScrollGallerySection = ({
  id = 'gallery',
  badge = "Types d'événements",
  titleLines = ['Un lieu pour', 'chaque occasion'],
  description = "Du WEI au gala de fin d'année, LINKHO trouve l'espace parfait pour votre événement.",
  items
}: ScrollGallerySectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const size = useWindowSize()
  const isMobile = size.width < 768

  const animValues = getAnimationValues(size.width)

  // Determine scroll offset (when the animation starts/ends relative to viewport)
  const scrollOffset: ['start end' | 'center end', 'center start'] =
    size.width < 2000 ? ['start end', 'center start'] : ['center end', 'center start']

  // Track scroll progress of the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: scrollOffset
  })

  const div1TranslateY = useTransform(scrollYProgress, [0, 0.5], [animValues.div1TranslateY, '0px'])
  const div1TranslateX = useTransform(scrollYProgress, [0, 0.5], [animValues.div1TranslateX, '0px'])

  const div2TranslateY = useTransform(scrollYProgress, [0, 0.5], [animValues.div2TranslateY, '0px'])
  const div2TranslateX = useTransform(scrollYProgress, [0, 0.5], [animValues.div2TranslateX, '0px'])
  const div2Rotate = useTransform(scrollYProgress, [0, 0.5], [12, 0])

  const div3TranslateY = useTransform(scrollYProgress, [0, 0.5], [animValues.div3TranslateY, '0px'])
  const div3TranslateX = useTransform(scrollYProgress, [0, 0.5], [animValues.div3TranslateX, '0px'])
  const div3Rotate = useTransform(scrollYProgress, [0, 0.5], [-2, 0])

  const div4TranslateY = useTransform(scrollYProgress, [0, 0.5], [animValues.div4TranslateY, '0px'])
  const div4TranslateX = useTransform(scrollYProgress, [0, 0.5], [animValues.div4TranslateX, '0px'])
  const div4Rotate = useTransform(scrollYProgress, [0, 0.5], [8, 0])

  const scale = useTransform(scrollYProgress, [0, 0.5], [animValues.divScale, 1])

  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [animValues.textOpacity, 1])
  const textTranslateY = useTransform(scrollYProgress, [0, 0.5], [animValues.textTranslateY, '0px'])
  const textScale = useTransform(scrollYProgress, [0, 0.5], [animValues.textScale, 1])

  const cardMotion = [
    { y: div1TranslateY, x: div1TranslateX, rotate: undefined, z: 'z-4' },
    { y: div2TranslateY, x: div2TranslateX, rotate: div2Rotate, z: 'z-3' },
    { y: div3TranslateY, x: div3TranslateX, rotate: div3Rotate, z: 'z-2' },
    { y: div4TranslateY, x: div4TranslateX, rotate: div4Rotate, z: 'z-1' }
  ]

  return (
    <section id={id} className='relative flex-1'>
      <MotionPreset
        fade
        blur
        transition={{ duration: 0.5 }}
        delay={0.15}
        className='mx-auto flex w-full max-w-6xl flex-col min-[1147px]:border-x min-[1147px]:border-line'
      >
        {/* Header */}
        <div className='space-y-2.5 px-4 py-16 md:px-6 lg:px-8'>
          <MotionPreset fade blur slide={{ direction: 'down', offset: 50 }} transition={{ duration: 0.5 }}>
            <Badge>{badge}</Badge>
          </MotionPreset>

          <div className='flex justify-between gap-4 max-md:flex-col'>
            <h2 className='max-w-100 text-2xl font-semibold text-navy sm:text-3xl lg:text-4xl'>
              {titleLines.map((line, i) => (
                <MotionPreset
                  key={i}
                  fade
                  blur
                  slide={{ direction: 'down', offset: 50 }}
                  delay={0.3 + i * 0.15}
                  transition={{ duration: 0.5 }}
                >
                  {line}
                </MotionPreset>
              ))}
            </h2>

            {description ? (
              <MotionPreset delay={0.3} fade blur slide={{ direction: 'down', offset: 50 }} transition={{ duration: 0.5 }}>
                <p className='text-ink max-w-xl text-lg'>{description}</p>
              </MotionPreset>
            ) : null}
          </div>
        </div>

        <MotionPreset delay={0.75} fade blur transition={{ duration: 0.5 }}>
          <hr className="border-gray-100 my-4" />
        </MotionPreset>

        <div
          ref={containerRef}
          className='relative grid gap-x-12.5 gap-y-16 px-4 py-16 max-sm:gap-y-8 sm:grid-cols-2 md:px-6 lg:px-8'
        >
          {items.slice(0, 4).map((item, index) => {
            const m = cardMotion[index]

            return (
              <motion.div
                key={index}
                style={{ translateY: m.y, translateX: m.x, scale, ...(m.rotate ? { rotate: m.rotate } : {}) }}
                transition={{ ease: 'easeInOut', duration: 0.6 }}
                className={cn(
                  'group relative flex flex-col gap-6 **:transition-all **:duration-300',
                  !isMobile && `${m.z} will-change-scroll perspective-distant transform-3d`
                )}
              >
                <div className='lg:h-93.5'>
                  <div
                    className={cn(
                      'overflow-hidden rounded-[12px] border border-line shadow-sm',
                      index % 2 === 0 ? 'group-hover:rotate-3' : 'group-hover:-rotate-3'
                    )}
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.titre}
                        className='w-full rounded-[12px] lg:h-93.5 lg:object-center'
                      />
                    ) : (
                      <div className='w-full rounded-[12px] bg-mist lg:h-93.5' />
                    )}
                  </div>
                </div>

                <motion.div
                  style={{ opacity: textOpacity, translateY: textTranslateY, scale: textScale }}
                  transition={{ type: 'spring', stiffness: 100, damping: 30, mass: 1 }}
                  className='-z-1 flex flex-col gap-2.5'
                >
                  <Badge className='w-fit'>{item.tag}</Badge>
                  <span className='text-2xl font-semibold text-navy'>{item.titre}</span>
                  <span className='text-ink leading-relaxed'>{item.description}</span>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </MotionPreset>
    </section>
  )
}

export default ScrollGallerySection
