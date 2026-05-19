'use client'

/**
 * src/hooks/useIntersectionTracking.ts
 *
 * Hook para rastrear visibilidade de seções via IntersectionObserver.
 * Muito mais performático do que escutar evento de scroll.
 *
 * - threshold: 0.3 → dispara quando 30% da seção está visível
 * - tracked.current: garante disparo único por visita (mesmo que role para cima)
 * - Retorna ref para anexar ao elemento DOM
 */

import { useRef, useEffect } from 'react'
import { trackScrollSection } from '@/utils/tracking'

export function useIntersectionTracking(sectionName: string) {
  const ref = useRef<HTMLElement>(null)
  const tracked = useRef(false) // dispara apenas uma vez por sessão

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true
          trackScrollSection(sectionName)
          observer.unobserve(el) // cleanup após primeiro disparo
        }
      },
      { threshold: 0.3 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [sectionName])

  return ref
}
