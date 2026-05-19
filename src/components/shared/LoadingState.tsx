import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/utils/cn'

export interface LoadingStateProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullPage?: boolean
}

export function LoadingState({
  label = 'Carregando...',
  size = 'md',
  className,
  fullPage = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullPage ? 'min-h-screen' : 'py-16',
        className,
      )}
      aria-live="polite"
      aria-label={label}
    >
      <Spinner size={size} label={label} />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
