'use client'

/**
 * LandingPageTracker — Rastreamento de seções da landing page.
 *
 * Componente "invisible" — não renderiza nenhum elemento DOM visível.
 * Usa IntersectionObserver para observar seções existentes pelo ID.
 * Cada seção dispara trackScrollSection() uma única vez (threshold: 30%).
 *
 * Incluído como filho direto no Server Component page.tsx — sem wrapper.
 * Mantém o Server Component intacto (zero mudanças nas sections inline).
 */

import { useEffect } from 'react'
import { trackPageView, trackScrollSection } from '@/utils/tracking'
import { usePathname } from 'next/navigation'

// Seções da landing page que recebem rastreamento de scroll
const TRACKED_SECTIONS = [
  'hero',
  'sobre',
  'para-quem',
  'programacao',
  'palestrantes',
  'memorias',
  'feedbacks',
  'ingressos',
  'faq',
  'cta-final',
]

export function LandingPageTracker() {
  const pathname = usePathname()

  // T097 — page_view ao montar
  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  // T098 — scroll_section via IntersectionObserver (30% threshold)
  useEffect(() => {
    const tracked = new Set<string>()
    const observers: IntersectionObserver[] = []

    for (const sectionId of TRACKED_SECTIONS) {
      const el = document.getElementById(sectionId)
      if (!el) continue

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !tracked.has(sectionId)) {
            tracked.add(sectionId)
            trackScrollSection(sectionId)
            observer.unobserve(el) // cada seção dispara uma vez
          }
        },
        { threshold: 0.3 },
      )

      observer.observe(el)
      observers.push(observer)
    }

    return () => observers.forEach((obs) => obs.disconnect())
  }, [])

  // Renderiza null — apenas side-effects
  return null
}
