'use client'

/**
 * CountdownTimer — exibe tempo restante até expiresAt.
 * Recalcula a cada segundo via setInterval.
 * Dispara onExpired quando chega a zero.
 * Respeita prefers-reduced-motion: exibe tempo estático se ativo.
 */

import { useState, useEffect, useRef } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface CountdownTimerProps {
  expiresAt: Date
  onExpired?: () => void
  className?: string
  label?: string
}

interface TimeLeft {
  minutes: number
  seconds: number
  total: number
}

function calcTimeLeft(expiresAt: Date): TimeLeft {
  const total = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
  return {
    total,
    minutes: Math.floor(total / 60),
    seconds: total % 60,
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function CountdownTimer({ expiresAt, onExpired, className, label = 'Tempo para expirar' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(expiresAt))
  const onExpiredRef = useRef(onExpired)
  onExpiredRef.current = onExpired

  // Verifica se o usuário prefere movimento reduzido
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  useEffect(() => {
    // Se prefers-reduced-motion, apenas mostrar o tempo estático sem intervalo
    if (prefersReducedMotion) return

    const interval = setInterval(() => {
      const tl = calcTimeLeft(expiresAt)
      setTimeLeft(tl)

      if (tl.total <= 0) {
        clearInterval(interval)
        onExpiredRef.current?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, prefersReducedMotion])

  const isExpired = timeLeft.total <= 0
  const isUrgent = timeLeft.total <= 300 // 5 minutos

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="timer"
      aria-label={`${label}: ${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`}
      aria-live="off"
    >
      <Clock
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isExpired ? 'text-destructive' : isUrgent ? 'text-warning' : 'text-muted-foreground',
        )}
        aria-hidden="true"
      />

      {isExpired ? (
        <span className="text-sm font-medium text-destructive">Expirado</span>
      ) : (
        <span
          className={cn(
            'font-mono text-sm font-medium tabular-nums transition-colors',
            isUrgent ? 'text-warning' : 'text-foreground',
          )}
        >
          {pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      )}
    </div>
  )
}
