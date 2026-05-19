import { cn } from '@/utils/cn'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

function Skeleton({ className, rounded = 'md', ...props }: SkeletonProps) {
  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded]

  return (
    <div
      className={cn('animate-shimmer', roundedClass, className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Skeleton }
