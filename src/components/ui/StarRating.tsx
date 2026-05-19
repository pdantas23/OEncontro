import { Star } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface StarRatingProps {
  value: number      // 1–5
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeClass = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function StarRating({
  value,
  max = 5,
  size = 'md',
  className,
  label,
}: StarRatingProps) {
  const clampedValue = Math.max(0, Math.min(value, max))

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={label ?? `${clampedValue} de ${max} estrelas`}
    >
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClass[size],
            'shrink-0 transition-colors',
            i < clampedValue
              ? 'fill-primary text-primary'
              : 'fill-transparent text-border',
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
