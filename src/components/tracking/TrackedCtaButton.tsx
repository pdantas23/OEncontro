'use client'

/**
 * TrackedCtaButton — Botão CTA com tracking T099.
 * Envolve um Link de CTA e dispara trackCtaClick() ao ser clicado.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { trackCtaClick } from '@/utils/tracking'

interface TrackedCtaButtonProps {
  href: string
  ctaName: string
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export function TrackedCtaButton({
  href,
  ctaName,
  children,
  className,
  variant = 'default',
  size = 'lg',
}: TrackedCtaButtonProps) {
  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={className}
      onClick={() => trackCtaClick(ctaName, href)}
    >
      <Link href={href}>{children}</Link>
    </Button>
  )
}
