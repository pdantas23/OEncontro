'use client'

import { useEffect, useState } from 'react'

/**
 * Tela de carregamento que cobre a página até o conteúdo estar pronto.
 * Esconde o conteúdo via CSS e faz fade-out ao carregar.
 */
export function PageLoader() {
  const [loaded, setLoaded] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (document.readyState === 'complete') {
      setLoaded(true)
      return
    }
    const onLoad = () => setLoaded(true)
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  // Remove do DOM após a animação de fade-out
  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => setHidden(true), 500)
      return () => clearTimeout(timer)
    }
  }, [loaded])

  if (hidden) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500 ${loaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      aria-label="Carregando"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-accent" />
        <span className="font-detail text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Carregando
        </span>
      </div>
    </div>
  )
}
