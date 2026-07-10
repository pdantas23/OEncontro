'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  /** Direção da animação */
  direction?: 'up' | 'left' | 'right'
  /** Delay em ms */
  delay?: number
}

export function ScrollReveal({
  children,
  className,
  direction = 'up',
  delay = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const transforms = {
    up: 'translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        visible ? 'opacity-100 translate-y-0 translate-x-0' : `opacity-0 ${transforms[direction]}`,
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
