'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { trackCtaClick } from '@/utils/tracking'
import { cn } from '@/utils/cn'

interface TrackedCtaLinkProps {
  href: string
  ctaName: string
  children: React.ReactNode
  className?: string
}

export function TrackedCtaLink({ href, ctaName, children, className }: TrackedCtaLinkProps) {
  return (
    <Link
      href={href}
      onClick={() => trackCtaClick(ctaName, href)}
      className={cn(
        'group inline-flex items-center gap-1.5 font-detail text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground',
        className,
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
    </Link>
  )
}
