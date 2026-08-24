import { cn } from '@/utils/cn'

export interface ProgressBarProps {
  /** Progresso em porcentagem (0–100) */
  value: number
  className?: string
  label?: string
}

export function ProgressBar({ value, className, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(value, 100))

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progresso'}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
