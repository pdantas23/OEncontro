import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeClass = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

function Spinner({ size = 'md', className, label = 'Carregando...' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Loader2
        className={cn('animate-spin text-primary', sizeClass[size], className)}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export { Spinner }
